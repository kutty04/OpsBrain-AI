from typing import List, Dict, Any, Optional
import re
import json
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from backend.config import settings, logger
from backend.models import OpsBrainException
from backend.database import get_db_connection, release_db_connection
import psycopg2.extras

class ExtractedAsset(BaseModel):
    tag_number: str = Field(..., description="Unique tag number visible on the diagram, e.g., P-101, V-102")
    name: str = Field(..., description="Descriptive name of the equipment, e.g., 'Main Crude Pump'")
    category: str = Field(..., description="Category: 'Pump', 'Valve', 'Vessel', 'Exchanger', 'Instrument', 'Line'")
    description: Optional[str] = Field(None, description="Details, ratings, or specs visible near the tag")
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class ExtractedConnection(BaseModel):
    source_tag: str = Field(..., description="Source component tag number")
    target_tag: str = Field(..., description="Target component tag number")
    relation_type: str = Field(..., description="Relation: 'FLOWS_TO', 'MEASURES', 'CONTROLS'")
    details: Optional[str] = Field(None, description="Pipeline details or signal details")
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class PIDExtractionResult(BaseModel):
    assets: List[ExtractedAsset]
    connections: List[ExtractedConnection]

class PIDParsingService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.error("PIDParsingService: GEMINI_API_KEY is not configured!")
            raise OpsBrainException("Gemini API Key is missing", code="GEMINI_API_KEY_MISSING")
        try:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("PIDParsingService: Google GenAI Client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Google GenAI Client: {e}")
            raise OpsBrainException(f"Failed to initialize Gemini: {e}", code="GEMINI_INIT_FAILED")

    def parse_pid_image(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        prompt = (
            "You are an expert Piping and Instrumentation (P&ID) engineer and computer vision parser.\n"
            "Analyze the attached P&ID drawing and extract:\n"
            "1. All physical assets: Tanks, Vessels, Heat Exchangers, Control Valves, Block/Manual Valves, Relief Valves, and Instruments (transmitters or controllers).\n"
            "2. All directed flow and control connections showing how components link together.\n\n"
            "EXTRACTION RULES:\n"
            "- Extract the exact Tag Number visible on the diagram (e.g., R-101, FT-101, FIC-101).\n"
            "- Identify descriptive names based on labels (e.g. 'Reactor / Mixing Tank').\n"
            "- Map component tags to these category classes: 'Pump', 'Valve', 'Vessel', 'Exchanger', 'Instrument', 'Line'.\n"
            "- Trace pipelines showing flow direction. Record relationships as 'FLOWS_TO'.\n"
            "- Trace control signals showing control loops. Record relationships as 'MEASURES' or 'CONTROLS'.\n"
            "- Record a confidence score (0.0 to 1.0) for every node and connection.\n\n"
            "Return the result strictly matching the provided JSON schema."
        )

        try:
            logger.info("Calling Gemini Vision model gemini-2.5-flash for P&ID extraction...")
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type
                    ),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PIDExtractionResult
                )
            )
            # Parse response json text
            result_json = json.loads(response.text)
            extraction_result = PIDExtractionResult(**result_json)
        except Exception as e:
            logger.error(f"Gemini Vision call or JSON validation failed: {e}")
            raise OpsBrainException(f"P&ID Vision extraction failed: {e}", code="PID_EXTRACTION_FAILED")

        # Save to DB inside a transaction
        return self.save_parsed_topology(extraction_result)

    def save_parsed_topology(self, data: PIDExtractionResult) -> Dict[str, int]:
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            node_tag_to_id = {}
            inserted_assets = 0
            inserted_nodes = 0
            inserted_edges = 0
            
            tag_regex = re.compile(r"^[A-Z0-9]{1,6}-\d{3,4}[A-Z]?$")

            # 1. Insert Assets & Nodes
            for asset in data.assets:
                # Validation: Confidence threshold
                if asset.confidence_score < 0.70:
                    logger.warning(f"Skipping low confidence asset: {asset.tag_number} ({asset.confidence_score})")
                    continue
                # Validation: Tag format regex check
                if not tag_regex.match(asset.tag_number):
                    logger.warning(f"Skipping invalid tag format: {asset.tag_number}")
                    continue

                # Insert Asset twin record
                cur.execute("""
                    INSERT INTO assets (tag_number, name, category, description)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (tag_number) DO UPDATE 
                    SET name = EXCLUDED.name, description = COALESCE(EXCLUDED.description, assets.description)
                    RETURNING id;
                """, (asset.tag_number, asset.name, asset.category, asset.description))
                asset_id = cur.fetchone()["id"]
                inserted_assets += 1

                # Insert corresponding Knowledge Node
                cur.execute("SELECT id FROM knowledge_nodes WHERE name = %s AND type = %s;", (asset.tag_number, asset.category))
                row = cur.fetchone()
                if row:
                    node_id = row["id"]
                    cur.execute("""
                        UPDATE knowledge_nodes 
                        SET asset_id = %s
                        WHERE id = %s;
                    """, (asset_id, node_id))
                else:
                    cur.execute("""
                        INSERT INTO knowledge_nodes (name, type, asset_id)
                        VALUES (%s, %s, %s)
                        RETURNING id;
                    """, (asset.tag_number, asset.category, asset_id))
                    node_id = cur.fetchone()["id"]
                    inserted_nodes += 1
                
                node_tag_to_id[asset.tag_number] = node_id

            # 2. Insert Connections (Edges)
            for conn_item in data.connections:
                # Validation: Confidence threshold
                if conn_item.confidence_score < 0.70:
                    logger.warning(f"Skipping low confidence connection: {conn_item.source_tag} -> {conn_item.target_tag}")
                    continue
                # Validation: Self loop filtering
                if conn_item.source_tag == conn_item.target_tag:
                    logger.warning(f"Skipping self-loop connection: {conn_item.source_tag}")
                    continue

                # Resolve source node ID, fallback to placeholder line
                source_id = node_tag_to_id.get(conn_item.source_tag)
                if not source_id:
                    logger.warning(f"Creating placeholder asset/node for source tag: {conn_item.source_tag}")
                    cur.execute("""
                        INSERT INTO assets (tag_number, name, category, description)
                        VALUES (%s, %s, 'Line', 'Auto-generated placeholder')
                        ON CONFLICT (tag_number) DO UPDATE SET name = assets.name
                        RETURNING id;
                    """, (conn_item.source_tag, f"Placeholder {conn_item.source_tag}"))
                    placeholder_asset_id = cur.fetchone()["id"]
                    cur.execute("""
                        INSERT INTO knowledge_nodes (name, type, asset_id)
                        VALUES (%s, 'Line', %s)
                        RETURNING id;
                    """, (conn_item.source_tag, placeholder_asset_id))
                    source_id = cur.fetchone()["id"]
                    node_tag_to_id[conn_item.source_tag] = source_id
                    inserted_assets += 1
                    inserted_nodes += 1

                # Resolve target node ID, fallback to placeholder line
                target_id = node_tag_to_id.get(conn_item.target_tag)
                if not target_id:
                    logger.warning(f"Creating placeholder asset/node for target tag: {conn_item.target_tag}")
                    cur.execute("""
                        INSERT INTO assets (tag_number, name, category, description)
                        VALUES (%s, %s, 'Line', 'Auto-generated placeholder')
                        ON CONFLICT (tag_number) DO UPDATE SET name = assets.name
                        RETURNING id;
                    """, (conn_item.target_tag, f"Placeholder {conn_item.target_tag}"))
                    placeholder_asset_id = cur.fetchone()["id"]
                    cur.execute("""
                        INSERT INTO knowledge_nodes (name, type, asset_id)
                        VALUES (%s, 'Line', %s)
                        RETURNING id;
                    """, (conn_item.target_tag, placeholder_asset_id))
                    target_id = cur.fetchone()["id"]
                    node_tag_to_id[conn_item.target_tag] = target_id
                    inserted_assets += 1
                    inserted_nodes += 1

                # Insert Edge
                metadata_str = json.dumps({"details": conn_item.details}) if conn_item.details else None
                cur.execute("""
                    INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, metadata)
                    VALUES (%s, %s, %s, 1.0, %s)
                    ON CONFLICT (source_id, target_id, relation_type) DO UPDATE 
                    SET metadata = EXCLUDED.metadata
                    RETURNING id;
                """, (source_id, target_id, conn_item.relation_type, metadata_str))
                inserted_edges += 1

            conn.commit()
            cur.close()
            return {
                "assets_created": inserted_assets,
                "nodes_created": inserted_nodes,
                "edges_created": inserted_edges
            }
        except Exception as e:
            conn.rollback()
            logger.error(f"P&ID DB insertion failed: {e}")
            raise OpsBrainException(f"Database insertion of P&ID failed: {e}", code="PID_DB_INSERTION_FAILED")
        finally:
            release_db_connection(conn)
