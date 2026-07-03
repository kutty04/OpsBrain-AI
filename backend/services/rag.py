from typing import List, Dict, Any, Optional
from mistralai.client import Mistral
from backend.config import settings, logger
from backend.models import OpsBrainException
from backend.services.embeddings import EmbeddingService
from backend.repositories.documents import DocumentsRepository

class RAGService:
    def __init__(self):
        self.embeddings_service = EmbeddingService()
        self.docs_repo = DocumentsRepository()
        
        # Initialize Mistral client
        self.mistral_client = None
        if settings.MISTRAL_API_KEY:
            try:
                self.mistral_client = Mistral(api_key=settings.MISTRAL_API_KEY)
                logger.info("RAGService: Mistral client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Mistral client: {e}")
        else:
            logger.warning("RAGService: MISTRAL_API_KEY is not configured. Fallback chain will bypass Mistral.")

    def query_rag(self, query_text: str, limit: int = 5, threshold: float = 0.35) -> Dict[str, Any]:
        # 1. Retrieve similar chunks
        try:
            logger.info(f"RAG query search: '{query_text}' with limit={limit}, threshold={threshold}")
            # EmbeddingService.search_similar_chunks automatically prepends BGE query instruction
            chunks = self.embeddings_service.search_similar_chunks(query_text, limit=limit, threshold=threshold)
        except Exception as e:
            logger.error(f"RAG retrieval pipeline failed: {e}")
            raise OpsBrainException(f"Retrieval pipeline failed: {e}", code="RETRIEVAL_FAILED")

        # 2. Hallucination Prevention Check: If no chunks pass the similarity threshold
        if not chunks:
            logger.info("No relevant chunks found above similarity threshold. Returning fallback response.")
            return {
                "answer": "I could not find relevant information in the provided documentation.",
                "sources": [],
                "grounded": False
            }

        # 3. Format context with labels for source traceability
        context_blocks = []
        sources = []
        
        for i, chunk in enumerate(chunks, 1):
            source_label = f"Source {i}"
            title = chunk.get("title", "Unknown Document")
            page_num = chunk.get("page_number", 1)
            content = chunk.get("content", "")
            similarity = chunk.get("similarity", 0.0)
            doc_id = chunk.get("document_id", "")

            # Traceable source citation mapping
            sources.append({
                "label": source_label,
                "document_id": str(doc_id) if doc_id else None,
                "title": title,
                "page_number": page_num,
                "similarity_score": round(similarity, 4)
            })

            # Structured block format for prompt grounding
            context_blocks.append(
                f"[{source_label}]: Title: {title}, Page: {page_num}\n"
                f"Content: {content}\n"
                f"---"
            )

        context_str = "\n\n".join(context_blocks)

        # 4. Formulate System Prompt
        system_prompt = (
            "You are a precise operations and maintenance assistant for OpsBrain AI.\n"
            "Your task is to answer the user query based ONLY on the provided Sources.\n\n"
            "CRITICAL RULES:\n"
            "1. Answer ONLY using facts directly mentioned in the Sources. Do not extrapolate, infer, or bring in outside knowledge.\n"
            "2. For every factual statement, you MUST cite the source index using the format `[Source X]` at the end of the sentence or clause.\n"
            "   Example: 'Crude Pump P-101 has a pressure limit of 150 PSI [Source 1].'\n"
            "3. If the sources do not contain enough information to answer the query, reply exactly:\n"
            "   'I could not find relevant information in the provided documentation.'\n"
            "4. NEVER mention sources that are not in the context. Never hallucinate. Keep the response factual and concise."
        )

        user_prompt = f"Sources:\n{context_str}\n\nQuery: {query_text}"

        # 5. Call LLM (via Provider Router failover: Groq -> Mistral -> Gemini -> Extractive -> Demo Fallback)
        from backend.agents.provider_router import router_instance
        try:
            plain_chunks = [c["content"] for c in chunks]
            router_res = router_instance.route_rag_answer(
                prompt=user_prompt,
                system_prompt=system_prompt,
                retrieved_chunks=plain_chunks
            )
            answer = router_res["answer"]
            provider_metadata = router_res["provider_metadata"]
        except Exception as e:
            logger.error(f"Provider Router failed to route RAG answer: {e}")
            raise OpsBrainException(f"LLM RAG completion failed: {e}", code="LLM_GENERATION_FAILED")

        # 6. Post-processing citation verification
        # If the model fallback was triggered, mark as not grounded
        is_grounded = True
        if "I could not find relevant information in the provided documentation" in answer:
            is_grounded = False
            sources = []

        return {
            "answer": answer,
            "sources": sources,
            "grounded": is_grounded,
            "provider_metadata": provider_metadata
        }

