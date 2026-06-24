import os
import shutil
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from backend.config import settings, logger
from backend.models import OpsBrainException, APIResponse
from backend.repositories.documents import DocumentsRepository
from backend.indexer import DocumentIndexer

router = APIRouter(prefix="/ingest", tags=["ingestion"])
docs_repo = DocumentsRepository()
indexer = DocumentIndexer()

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_uploads")

def determine_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return "PDF"
    elif ext == ".docx":
        return "DOCX"
    elif ext == ".xlsx":
        return "XLSX"
    elif ext == ".csv":
        return "CSV"
    elif ext == ".txt":
        return "TXT"
    else:
        raise OpsBrainException(f"Unsupported file format: {ext}", code="INVALID_FILE_FORMAT", status_code=400)

def process_document_task(document_id: str, filepath: str, file_type: str):
    logger.info(f"Background Task: Starting ingestion for doc {document_id} ({file_type})...")
    try:
        # 1. Extract text and metadata
        text, file_metadata = indexer.extract_text_and_metadata(filepath, file_type)
        
        # 2. Update document metadata in DB (Status: PROCESSING)
        # Note: We can implement a direct UPDATE statement in DocumentsRepository or execute it raw
        # Let's run direct DB updates using a cursor from docs_repo
        with docs_repo.get_cursor() as cur:
            import json
            cur.execute(
                "UPDATE documents SET metadata = %s WHERE id = %s;",
                (json.dumps(file_metadata), document_id)
            )
            
        # 3. Chunk text
        chunks = indexer.chunk_text(text, file_metadata)
        
        # 4. Generate embeddings and insert chunks
        if chunks:
            chunk_contents = [c["content"] for c in chunks]
            embeddings = indexer.generate_embeddings(chunk_contents)
            
            for i, chunk in enumerate(chunks):
                docs_repo.insert_chunk(
                    document_id=document_id,
                    content=chunk["content"],
                    embedding=embeddings[i],
                    page_number=chunk.get("page_number", 1)
                )
                
        # 5. Update Status to PROCESSED
        with docs_repo.get_cursor() as cur:
            cur.execute(
                "UPDATE documents SET metadata = jsonb_set(metadata, '{status}', '\"PROCESSED\"') WHERE id = %s;",
                (document_id,)
            )
        logger.info(f"Background Task: Ingestion SUCCESS for doc {document_id}")

    except Exception as e:
        logger.error(f"Background Task: Ingestion FAILED for doc {document_id}: {e}")
        # Update Status to FAILED
        try:
            with docs_repo.get_cursor() as cur:
                cur.execute(
                    "UPDATE documents SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', %s) WHERE id = %s;",
                    (json.dumps(str(e)), document_id)
                )
        except Exception as db_err:
            logger.error(f"Failed to write error status to DB: {db_err}")
            
    finally:
        # Clean up temp file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                logger.info(f"Cleaned up temp file: {filepath}")
            except Exception as e:
                logger.error(f"Failed to remove temp file {filepath}: {e}")

@router.post("/document")
async def ingest_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    logger.info(f"Received file upload request: {file.filename}")
    
    # 1. Validate file extension
    file_type = determine_file_type(file.filename)
    
    # 2. Create document entry
    initial_metadata = {"status": "PENDING"}
    doc = docs_repo.create_document(
        title=file.filename,
        file_type=file_type,
        metadata=initial_metadata
    )
    
    # Ensure temp dir exists
    os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
    temp_filepath = os.path.join(TEMP_UPLOAD_DIR, f"{doc['id']}_{file.filename}")
    
    # 3. Save uploaded file to temp path
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save temp file: {e}")
        raise OpsBrainException(f"File save failed: {e}", code="FILE_SAVE_FAILED", status_code=500)
        
    # 4. Trigger background task
    background_tasks.add_task(process_document_task, doc["id"], temp_filepath, file_type)
    
    return {
        "success": True,
        "message": "Document upload received. Processing started in the background.",
        "data": {
            "document_id": doc["id"],
            "title": doc["title"],
            "file_type": doc["file_type"]
        }
    }

@router.get("/documents", response_model=APIResponse)
async def list_documents():
    logger.info("Listing all ingested documents")
    try:
        documents = docs_repo.get_all_documents()
        # Serialize datetime
        import datetime as dt
        serialized = []
        for d in documents:
            item = dict(d)
            if "created_at" in item and isinstance(item["created_at"], dt.datetime):
                item["created_at"] = item["created_at"].isoformat()
            serialized.append(item)
            
        return APIResponse(
            success=True,
            message="Documents retrieved successfully",
            data=serialized
        )
    except Exception as e:
        logger.error(f"Failed to retrieve documents: {e}")
        raise OpsBrainException(f"Failed to list documents: {e}", code="DOC_LIST_FAILED")
