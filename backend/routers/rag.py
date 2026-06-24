from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from backend.models import APIResponse
from backend.services.rag import RAGService

router = APIRouter(tags=["RAG"])
rag_service = RAGService()

class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user query text.")
    limit: int = Field(5, ge=1, le=20, description="Max contexts to retrieve.")
    threshold: float = Field(0.35, ge=0.0, le=1.0, description="Cosine similarity cutoff threshold.")

@router.post("/rag/query", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def query_rag_endpoint(request: RAGQueryRequest):
    result = rag_service.query_rag(
        query_text=request.query,
        limit=request.limit,
        threshold=request.threshold
    )
    return APIResponse(
        success=True,
        message="RAG query completed successfully",
        data=result
    )
