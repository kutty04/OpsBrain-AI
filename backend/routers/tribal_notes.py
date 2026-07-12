from fastapi import APIRouter, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.models import APIResponse, OpsBrainException
from backend.database import get_db_connection, release_db_connection
from backend.config import logger
import datetime as dt

router = APIRouter(prefix="/tribal-notes", tags=["Tribal Knowledge / Field Notes"])

class TribalNoteCreate(BaseModel):
    asset_tag: str = Field(..., min_length=1, description="Asset tag to attach the note to")
    note_text: str = Field(..., min_length=1, description="Content of the field note")
    source_type: str = Field("Field Note", description="Source type, e.g., Field Note, Tribal Knowledge")
    author_role: Optional[str] = Field(None, description="Role of the author")
    confidence: Optional[str] = Field(None, description="Confidence level or nature of observation")

class TribalNoteResponse(BaseModel):
    id: str
    asset_tag: str
    note_text: str
    source_type: str
    author_role: Optional[str]
    confidence: Optional[str]
    created_at: str

@router.get("", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def list_tribal_notes(asset_tag: Optional[str] = Query(None, description="Filter by asset tag")):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Ensure table exists (idempotent check)
        cur.execute("""
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
        conn.commit()

        if asset_tag:
            cur.execute(
                "SELECT id, asset_tag, note_text, source_type, author_role, confidence, created_at FROM tribal_knowledge_notes WHERE asset_tag = %s ORDER BY created_at DESC;",
                (asset_tag,)
            )
        else:
            cur.execute(
                "SELECT id, asset_tag, note_text, source_type, author_role, confidence, created_at FROM tribal_knowledge_notes ORDER BY created_at DESC;"
            )
        
        rows = cur.fetchall()
        notes = []
        for r in rows:
            notes.append({
                "id": str(r[0]),
                "asset_tag": r[1],
                "note_text": r[2],
                "source_type": r[3],
                "author_role": r[4],
                "confidence": r[5],
                "created_at": r[6].isoformat() if isinstance(r[6], dt.datetime) else str(r[6])
            })
        
        cur.close()
        return APIResponse(
            success=True,
            message="Tribal notes retrieved successfully",
            data=notes
        )
    except Exception as e:
        logger.error(f"Failed to list tribal notes: {e}")
        conn.rollback()
        raise OpsBrainException(f"Failed to retrieve tribal notes: {e}", code="TRIBAL_NOTES_RETRIEVAL_FAILED")
    finally:
        release_db_connection(conn)

@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_tribal_note(request: TribalNoteCreate):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Ensure table exists (idempotent check)
        cur.execute("""
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
        
        cur.execute(
            "INSERT INTO tribal_knowledge_notes (asset_tag, note_text, source_type, author_role, confidence) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at;",
            (request.asset_tag, request.note_text, request.source_type, request.author_role, request.confidence)
        )
        row = cur.fetchone()
        note_id = str(row[0])
        created_at = row[1].isoformat() if isinstance(row[1], dt.datetime) else str(row[1])
        
        conn.commit()
        cur.close()
        
        response_data = {
            "id": note_id,
            "asset_tag": request.asset_tag,
            "note_text": request.note_text,
            "source_type": request.source_type,
            "author_role": request.author_role,
            "confidence": request.confidence,
            "created_at": created_at
        }
        
        return APIResponse(
            success=True,
            message="Tribal note saved successfully",
            data=response_data
        )
    except Exception as e:
        logger.error(f"Failed to save tribal note: {e}")
        conn.rollback()
        raise OpsBrainException(f"Failed to save tribal note: {e}", code="TRIBAL_NOTE_SAVE_FAILED")
    finally:
        release_db_connection(conn)
