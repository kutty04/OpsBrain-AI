from fastapi import APIRouter, status
from typing import Dict
from backend.models import APIResponse, OpsBrainException
from backend.database import get_db_connection, release_db_connection
from backend.repositories.assets import AssetsRepository
from backend.repositories.documents import DocumentsRepository
from backend.indexer import DocumentIndexer
from backend.config import settings, logger
import datetime as dt

router = APIRouter(prefix="/demo", tags=["Demo Management"])
assets_repo = AssetsRepository()
docs_repo = DocumentsRepository()
indexer = DocumentIndexer()

@router.post("/seed-vizag", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def seed_vizag_coke_oven_scenario():
    if not settings.ENABLE_DEMO_SEED:
        raise OpsBrainException("Demo seeding is disabled in production.", code="DEMO_SEED_DISABLED", status_code=status.HTTP_403_FORBIDDEN)
    logger.info("Initializing Vizag Steel Coke Oven Battery scenario seeding...")
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # 1. Truncate existing transactional and graph tables to reset state
        logger.info("Purging existing data (excluding system document vector indices)...")
        cur.execute("TRUNCATE TABLE compliance_records, asset_risk_scores, incidents, maintenance_logs, knowledge_edges, knowledge_nodes, assets CASCADE;")
        conn.commit()

        # 2. Insert Vizag Coke Oven Assets
        logger.info("Inserting Vizag Coke Oven assets...")
        assets = [
            ("COB-1", "Coke Oven Battery #1", "Vessel", "Primary coking unit containing 65 carbonization chambers at Vizag Steel Plant."),
            ("CC-101", "Coal Charging Car #1", "Vessel", "Operates on top of the battery to load coal blends into ovens."),
            ("CP-102", "Coke Pusher Car #1", "Pump", "Operates on pusher side to push hot coke into the quenching car."),
            ("GCM-104", "Gas Collecting Main", "Vessel", "Collects hot volatile raw coke oven gas generated during carbonization."),
            ("PSV-202", "Collector Pressure Control Valve", "Valve", "Main control valve regulating collector gas back-pressure."),
            ("HE-301", "Liquor Heat Exchanger", "Exchanger", "Exchanges heat from flushing liquor to cool down raw gas."),
            ("PT-202", "Pressure Transmitter", "Instrument", "Measures back-pressure of raw gas collector main."),
            ("PIC-202", "Pressure Controller", "Instrument", "Maintains gas main pressure loop by adjusting PSV-202.")
        ]
        
        asset_ids = {}
        for tag, name, cat, desc in assets:
            cur.execute(
                "INSERT INTO assets (tag_number, name, category, description) VALUES (%s, %s, %s, %s) RETURNING id;",
                (tag, name, cat, desc)
            )
            asset_ids[tag] = cur.fetchone()[0]

        # 3. Insert Risk Scores
        logger.info("Inserting risk profiles...")
        now = dt.datetime.utcnow()
        yesterday = now - dt.timedelta(days=1)
        
        risk_scores = [
            (asset_ids["GCM-104"], 88, "Critical", "Collector main raw gas pressure spiked. Excessive fluctuations registered."),
            (asset_ids["COB-1"], 72, "High", "Fugitive emission door leaks reported on multiple carbonization chambers."),
            (asset_ids["PSV-202"], 45, "Medium", "Minor actuator position feedback drift reported by technician."),
            (asset_ids["HE-301"], 20, "Low", "Flushing liquor inlet/outlet temperatures are within normal limits.")
        ]
        for aid, score, lvl, exp in risk_scores:
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (aid, score, lvl, exp, now)
            )

        # 4. Insert Incidents
        logger.info("Inserting incident history logs...")
        incidents = [
            (asset_ids["GCM-104"], "Collector Main Pressure Spike", "Gas collector main GCM-104 pressure spiked to 350 mmWC (normal range 10-15 mmWC) causing emergency bleed valve bypass.", "Proportional controller output frozen", "Critical", now - dt.timedelta(hours=2)),
            (asset_ids["COB-1"], "Oven #12 Door Emission Leak", "Fugitive emission leakage of gas observed from charging doors during carbonization cycle, violating regulatory environmental limits.", "Door gasket rope seal wear", "High", now - dt.timedelta(days=1)),
            (asset_ids["CP-102"], "Pusher Car Ram Alignment Drift", "Pusher CP-102 ram travel resistance exceeded normal bounds due to minor alignment drift.", "Guide rail structural friction", "Medium", now - dt.timedelta(days=3))
        ]
        for aid, title, desc, rc, sev, date in incidents:
            cur.execute(
                "INSERT INTO incidents (asset_id, title, description, root_cause, severity, incident_date) VALUES (%s, %s, %s, %s, %s, %s);",
                (aid, title, desc, rc, sev, date)
            )

        # 5. Insert Maintenance Logs
        logger.info("Inserting maintenance logs...")
        maintenance = [
            (asset_ids["PIC-202"], "WO-7718", "Calibrated pressure controller loop and replaced feedback wiring", "S. Roy", now - dt.timedelta(hours=1), 1200.00),
            (asset_ids["COB-1"], "WO-7715", "Replaced worn graphite door seal ropes on Oven #12 and #13", "A. Prasad", now - dt.timedelta(hours=12), 3500.00),
            (asset_ids["CP-102"], "WO-7702", "Lubricated pusher ram guide tracks and calibrated travel sensor", "K. Singh", now - dt.timedelta(days=2), 800.00)
        ]
        for aid, wo, desc, perf, date, cost in maintenance:
            cur.execute(
                "INSERT INTO maintenance_logs (asset_id, work_order_number, description, performed_by, maintenance_date, cost) VALUES (%s, %s, %s, %s, %s, %s);",
                (aid, wo, desc, perf, date, cost)
            )

        # 6. Insert Compliance Records
        logger.info("Inserting regulatory compliance check states...")
        compliance = [
            (asset_ids["COB-1"], "CREP-2026 Emission Guidelines", "NON_COMPLIANT", "Fugitive door leakage exceeded maximum duration of 15 seconds per charging cycle on Oven #12."),
            (asset_ids["HE-301"], "OISD-GDN-201 Safety Standard", "COMPLIANT", "Flushing liquor bypass safety valve tested and operational."),
            (asset_ids["GCM-104"], "APPCB Environmental Norms", "UNDER_REVIEW", "Detailed gas analysis check scheduled following the pressure spike incident.")
        ]
        for aid, reg, stat, find in compliance:
            cur.execute(
                "INSERT INTO compliance_records (asset_id, regulation_name, status, findings, last_checked) VALUES (%s, %s, %s, %s, %s);",
                (aid, reg, stat, find, now)
            )

        # 7. Insert Knowledge Graph Nodes
        logger.info("Generating topology nodes...")
        nodes = {}
        for tag, _, cat, _ in assets:
            cur.execute(
                "INSERT INTO knowledge_nodes (name, type, asset_id, metadata) VALUES (%s, %s, %s, %s) RETURNING id;",
                (tag, "Asset", asset_ids[tag], '{"category": "' + cat + '"}')
            )
            nodes[tag] = cur.fetchone()[0]

        # 8. Insert Knowledge Graph Edges
        logger.info("Generating topology edges...")
        edges = [
            (nodes["CC-101"], nodes["COB-1"], "FLOWS_TO", 0.95),  # Coal flow
            (nodes["COB-1"], nodes["GCM-104"], "FLOWS_TO", 0.98), # Gas flow
            (nodes["GCM-104"], nodes["PSV-202"], "FLOWS_TO", 0.95),
            (nodes["GCM-104"], nodes["HE-301"], "FLOWS_TO", 0.95),
            (nodes["PT-202"], nodes["GCM-104"], "MEASURES", 0.99),
            (nodes["PT-202"], nodes["PIC-202"], "MEASURES", 0.99),
            (nodes["PIC-202"], nodes["PSV-202"], "CONTROLS", 0.99),
            (nodes["CP-102"], nodes["COB-1"], "FLOWS_TO", 0.90)  # Pushes coke
        ]
        for src, tgt, rel, weight in edges:
            cur.execute(
                "INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, metadata) VALUES (%s, %s, %s, %s, %s);",
                (src, tgt, rel, weight, '{"source": "seed"}')
            )

        # 9. Insert RAG Scenario Documentation and generate BGE-384 Embeddings
        logger.info("Deleting previous demo documents to avoid RAG duplicates...")
        cur.execute("DELETE FROM documents WHERE title = 'vizag_coke_oven_sop.txt';")
        conn.commit()

        logger.info("Indexing Vizag Coke Oven SOP for RAG agent query answers...")
        doc = docs_repo.create_document(
            title="vizag_coke_oven_sop.txt",
            file_type="TXT",
            metadata={"status": "PROCESSING", "source": "Vizag Demo Seeder"}
        )
        doc_id = doc["id"]

        sop_passages = [
            "Operating Standard: Vizag Steel Coke Oven Battery 1 (COB-1) contains 65 carbonization chambers. Blended coal is loaded into chambers by the Coal Charging Car (CC-101) from top holes. Normal carbonization cycle is 17 to 20 hours.",
            "Pressure Control Loop: Collector main pressure must be regulated between 10 to 15 mmWC by the controller loop PIC-202 manipulating the valve PSV-202. Spikes above 300 mmWC trigger emergency bleed valve bypass safety protocols.",
            "Environmental Mandate: Under CREP guidelines, visible door emissions during the carbonization cycle on COB-1 must not exceed 5% of doors. Visible leaks from charging hole lids are limited to 1% of holes."
        ]

        logger.info(f"Generating BGE-384 embeddings for {len(sop_passages)} SOP chunks...")
        embeddings = indexer.generate_embeddings(sop_passages)
        
        for i, text_chunk in enumerate(sop_passages):
            docs_repo.insert_chunk(
                document_id=doc_id,
                content=text_chunk,
                embedding=embeddings[i],
                page_number=i + 1
            )

        cur.execute(
            "UPDATE documents SET metadata = '{\"status\": \"PROCESSED\", \"source\": \"Vizag Demo Seeder\"}' WHERE id = %s;",
            (doc_id,)
        )

        conn.commit()
        cur.close()
        release_db_connection(conn)
        conn = None
        logger.info("Vizag Coke Oven Battery scenario successfully seeded and indexed!")

        # 10. Seed Tribal Knowledge Notes (Phase 5A) - safely isolated
        notes_conn = get_db_connection()
        try:
            notes_cur = notes_conn.cursor()
            notes_cur.execute("""
                CREATE TABLE IF NOT EXISTS tribal_knowledge_notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    asset_tag VARCHAR(50) NOT NULL,
                    note_text TEXT NOT NULL,
                    source_type VARCHAR(100) DEFAULT 'Field Note',
                    author_role VARCHAR(100),
                    confidence VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                );
            """)
            notes_cur.execute("TRUNCATE TABLE tribal_knowledge_notes CASCADE;")
            
            demo_notes = [
                ("PSV-202", "During monsoon, valve response becomes sticky after long idle time. Inspect actuator before restart.", "Field Note", "Senior Technician", "Operator observed"),
                ("GCM-104", "Night shift operators report pressure drift when upstream charging rhythm changes rapidly.", "Field Note", "Shift Engineer", "Repeated field observation"),
                ("COB-1", "Door seal wear is usually noticed first as short smoke bursts during charging cycles.", "Field Note", "Maintenance Supervisor", "Maintenance experience")
            ]
            for tag, text, st, role, conf in demo_notes:
                notes_cur.execute(
                    "INSERT INTO tribal_knowledge_notes (asset_tag, note_text, source_type, author_role, confidence) VALUES (%s, %s, %s, %s, %s);",
                    (tag, text, st, role, conf)
                )
            notes_conn.commit()
            notes_cur.close()
            logger.info("Demo tribal knowledge notes seeded successfully.")
        except Exception as e:
            logger.warning(f"Failed to seed tribal knowledge notes (non-fatal): {e}")
            notes_conn.rollback()
        finally:
            release_db_connection(notes_conn)

        # Load all assets back to return in response
        seeded_assets = assets_repo.get_all_assets()
        # Serialize dt
        serialized = []
        for sa in seeded_assets:
            item = dict(sa)
            if "created_at" in item and isinstance(item["created_at"], dt.datetime):
                item["created_at"] = item["created_at"].isoformat()
            serialized.append(item)

        return APIResponse(
            success=True,
            message="Vizag Coke Oven Battery scenario seeded successfully.",
            data={
                "assets_count": len(serialized),
                "assets": serialized
            }
        )

    except Exception as e:
        logger.error(f"Scenario seeding failed: {e}")
        conn.rollback()
        raise OpsBrainException(f"Scenario seeding failed: {e}", code="SCENARIO_SEEDING_FAILED")
    finally:
        if conn:
            release_db_connection(conn)

@router.post("/seed-refinery", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def seed_refinery_scenario():
    if not settings.ENABLE_DEMO_SEED:
        raise OpsBrainException("Demo seeding is disabled in production.", code="DEMO_SEED_DISABLED", status_code=status.HTTP_403_FORBIDDEN)
        
    logger.info("Initializing Refinery Pump Station scenario seeding...")
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # 1. Truncate existing transactional and graph tables to reset state
        logger.info("Purging existing data (excluding system document vector indices)...")
        cur.execute("TRUNCATE TABLE compliance_records, asset_risk_scores, incidents, maintenance_logs, knowledge_edges, knowledge_nodes, assets CASCADE;")
        conn.commit()

        # 2. Insert Refinery Pump Station Assets
        logger.info("Inserting Refinery Pump Station assets...")
        assets = [
            ("RPS-1", "Refinery Pump Station 1", "Station", "Refinery Pump Station 1 system and station bounds."),
            ("TK-501", "Feed Storage Tank", "Vessel", "Storage tank feeding refinery pump station transfer pump P-101."),
            ("P-101", "Feed Transfer Pump", "Pump", "Primary transfer pump operating at design pressure limit of 12 bar."),
            ("M-101", "Pump Motor", "Motor", "Pump motor driving primary feed transfer pump P-101."),
            ("VLV-201", "Discharge Isolation Valve", "Valve", "Main valve isolating the discharge line of pump P-101."),
            ("PT-301", "Discharge Pressure Transmitter", "Instrument", "Measures discharge pressure of feed transfer pump P-101.")
        ]
        
        asset_ids = {}
        for tag, name, cat, desc in assets:
            cur.execute(
                "INSERT INTO assets (tag_number, name, category, description) VALUES (%s, %s, %s, %s) RETURNING id;",
                (tag, name, cat, desc)
            )
            asset_ids[tag] = cur.fetchone()[0]

        # 3. Insert Risk Scores
        logger.info("Inserting risk profiles...")
        now = dt.datetime.utcnow()
        
        risk_scores = [
            (asset_ids["P-101"], 90, "Critical", "Discharge pressure exceeded normal operating limit (Observed: 18 bar, Allowed: 12 bar).")
        ]
        for aid, score, lvl, exp in risk_scores:
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (aid, score, lvl, exp, now)
            )

        # 4. Insert Incidents
        logger.info("Inserting incident history logs...")
        incidents = [
            (asset_ids["P-101"], "High discharge pressure alarm during startup", "Discharge pressure reached 18 bar, exceeding normal operating limit.", "Inspect VLV-201 opening status, verify PT-301 calibration, inspect M-101 motor load", "High", now - dt.timedelta(hours=2))
        ]
        for aid, title, desc, rc, sev, date in incidents:
            cur.execute(
                "INSERT INTO incidents (asset_id, title, description, root_cause, severity, incident_date) VALUES (%s, %s, %s, %s, %s, %s);",
                (aid, title, desc, rc, sev, date)
            )

        # 5. Insert Maintenance Logs
        logger.info("Inserting maintenance logs...")
        maintenance = [
            (asset_ids["P-101"], "WO-9901", "Inspect VLV-201 opening status, verify PT-301 calibration, inspect M-101 motor load", "J. Doe", now - dt.timedelta(hours=1), 500.00)
        ]
        for aid, wo, desc, perf, date, cost in maintenance:
            cur.execute(
                "INSERT INTO maintenance_logs (asset_id, work_order_number, description, performed_by, maintenance_date, cost) VALUES (%s, %s, %s, %s, %s, %s);",
                (aid, wo, desc, perf, date, cost)
            )

        # 6. Insert Compliance Records
        logger.info("Inserting regulatory compliance check states...")
        compliance = [
            (asset_ids["P-101"], "Refinery Operating Standards", "NON_COMPLIANT", "Discharge pressure exceeded normal operating limit (Observed: 18 bar, Allowed: 12 bar). Recommended action: Check VLV-201 blockage and inspect pump motor load before restart.")
        ]
        for aid, reg, stat, find in compliance:
            cur.execute(
                "INSERT INTO compliance_records (asset_id, regulation_name, status, findings, last_checked) VALUES (%s, %s, %s, %s, %s);",
                (aid, reg, stat, find, now)
            )

        # 7. Insert Knowledge Graph Nodes
        logger.info("Generating topology nodes...")
        nodes = {}
        for tag, _, cat, _ in assets:
            cur.execute(
                "INSERT INTO knowledge_nodes (name, type, asset_id, metadata) VALUES (%s, %s, %s, %s) RETURNING id;",
                (tag, "Asset", asset_ids[tag], '{"category": "' + cat + '"}')
            )
            nodes[tag] = cur.fetchone()[0]

        # 8. Insert Knowledge Graph Edges
        logger.info("Generating topology edges...")
        edges = [
            (nodes["TK-501"], nodes["P-101"], "FLOWS_TO", 0.95),
            (nodes["P-101"], nodes["VLV-201"], "FLOWS_TO", 0.95),
            (nodes["P-101"], nodes["M-101"], "DRIVEN_BY", 0.99),
            (nodes["PT-301"], nodes["P-101"], "MEASURES", 0.99),
            (nodes["VLV-201"], nodes["RPS-1"], "PROTECTS_OR_ISOLATES", 0.95)
        ]
        for src, tgt, rel, weight in edges:
            cur.execute(
                "INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, metadata) VALUES (%s, %s, %s, %s, %s);",
                (src, tgt, rel, weight, '{"source": "seed"}')
            )

        # 9. Insert RAG Scenario Documentation (without BGE model / LLM / embedding generation calls)
        logger.info("Deleting previous demo documents to avoid RAG duplicates...")
        cur.execute("DELETE FROM documents WHERE title = 'refinery_pump_station_sop.txt';")
        conn.commit()

        logger.info("Indexing Refinery Pump Station SOP for RAG agent query answers...")
        doc = docs_repo.create_document(
            title="refinery_pump_station_sop.txt",
            file_type="TXT",
            metadata={"status": "PROCESSING", "source": "Refinery Demo Seeder"}
        )
        doc_id = doc["id"]

        sop_passages = [
            "Refinery Pump Station 1 (RPS-1) Operating Standard: The Feed Storage Tank (TK-501) stores primary feedstock and directly feeds the Feed Transfer Pump (P-101). The Feed Transfer Pump (P-101) discharges pressurized feedstock through the Discharge Isolation Valve (VLV-201) to downstream refinery processes. The Pump Motor (M-101) drives the rotation of the transfer pump P-101.",
            "Pressure Monitoring Loop: The Discharge Pressure Transmitter (PT-301) measures the raw discharge pressure at the outlet of pump P-101. The normal operating pressure limit of the station is 12 bar.",
            "Operating Limits and Alarms: If the discharge pressure reaches 18 bar, it exceeds the safe regulatory bounds, triggering high-pressure alarms. In the event of a pressure spike or high discharge pressure alarm, operators must: 1. Inspect the opening status of the Discharge Isolation Valve (VLV-201) for blockages or partial closure. 2. Verify the calibration of the Discharge Pressure Transmitter (PT-301) against the local analog physical gauge. 3. Check the motor load on the Pump Motor (M-101) for signs of electrical overload."
        ]

        logger.info(f"Writing static placeholder embeddings for {len(sop_passages)} chunks...")
        # Use simple static placeholder embeddings ([0.0] * 384) to satisfy schema but avoid slow BGE embeddings generation
        dummy_embedding = [0.0] * 384
        
        for i, text_chunk in enumerate(sop_passages):
            docs_repo.insert_chunk(
                document_id=doc_id,
                content=text_chunk,
                embedding=dummy_embedding,
                page_number=i + 1
            )

        cur.execute(
            "UPDATE documents SET metadata = '{\"status\": \"PROCESSED\", \"source\": \"Refinery Demo Seeder\"}' WHERE id = %s;",
            (doc_id,)
        )

        conn.commit()
        cur.close()
        release_db_connection(conn)
        conn = None
        logger.info("Refinery Pump Station scenario successfully seeded!")

        # 10. Seed Tribal Knowledge Notes
        notes_conn = get_db_connection()
        try:
            notes_cur = notes_conn.cursor()
            notes_cur.execute("""
                CREATE TABLE IF NOT EXISTS tribal_knowledge_notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    asset_tag VARCHAR(50) NOT NULL,
                    note_text TEXT NOT NULL,
                    source_type VARCHAR(100) DEFAULT 'Field Note',
                    author_role VARCHAR(100),
                    confidence VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                );
            """)
            notes_cur.execute("TRUNCATE TABLE tribal_knowledge_notes CASCADE;")
            
            demo_notes = [
                ("PT-301", "When PT-301 reads above 12 bar, double check the physical pressure gauge near VLV-201 outlet to verify sensor calibration.", "Field Note", "Senior Operator", "Repeated field observation")
            ]
            for tag, text, st, role, conf in demo_notes:
                notes_cur.execute(
                    "INSERT INTO tribal_knowledge_notes (asset_tag, note_text, source_type, author_role, confidence) VALUES (%s, %s, %s, %s, %s);",
                    (tag, text, st, role, conf)
                )
            notes_conn.commit()
            notes_cur.close()
            logger.info("Demo refinery tribal knowledge notes seeded successfully.")
        except Exception as e:
            logger.warning(f"Failed to seed refinery tribal knowledge notes (non-fatal): {e}")
            notes_conn.rollback()
        finally:
            release_db_connection(notes_conn)

        # Load all assets back to return in response
        seeded_assets = assets_repo.get_all_assets()
        serialized = []
        for sa in seeded_assets:
            item = dict(sa)
            if "created_at" in item and isinstance(item["created_at"], dt.datetime):
                item["created_at"] = item["created_at"].isoformat()
            serialized.append(item)

        return APIResponse(
            success=True,
            message="Refinery Pump Station scenario seeded successfully.",
            data={
                "assets_count": len(serialized),
                "assets": serialized
            }
        )

    except Exception as e:
        logger.error(f"Refinery scenario seeding failed: {e}")
        if conn:
            conn.rollback()
        raise OpsBrainException(f"Refinery scenario seeding failed: {e}", code="SCENARIO_SEEDING_FAILED")
    finally:
        if conn:
            release_db_connection(conn)
