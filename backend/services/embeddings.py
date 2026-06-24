import time
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from backend.config import settings, logger
from backend.models import OpsBrainException
from backend.repositories.documents import DocumentsRepository
from backend.indexer import DocumentIndexer

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            logger.info(f"EmbeddingService: Initializing local BGE model {settings.EMBEDDING_MODEL_NAME}...")
            try:
                cls._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                logger.info("EmbeddingService: Local BGE model loaded successfully!")
            except Exception as e:
                logger.error(f"Failed to load local BGE model: {e}")
                raise OpsBrainException(f"Failed to initialize embedding model: {e}", code="EMBEDDING_INIT_FAILED")
        return cls._model

    def generate_embeddings_batch(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        model = self.get_model()
        try:
            logger.info(f"Generating embeddings for batch of {len(texts)} chunks...")
            embeddings = model.encode(texts, batch_size=batch_size, show_progress_bar=False, convert_to_numpy=True).tolist()
            return embeddings
        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            raise OpsBrainException(f"Embedding generation failed: {e}", code="EMBEDDING_GENERATION_FAILED")

    def search_similar_chunks(self, query: str, limit: int = 5, threshold: float = 0.4) -> List[Dict[str, Any]]:
        model = self.get_model()
        try:
            # Prepend BGE-specific retrieval instruction to the query text
            bge_query = f"Represent this sentence for searching relevant passages: {query}"
            query_vector = model.encode(bge_query, convert_to_numpy=True).tolist()
        except Exception as e:
            logger.error(f"Failed to encode search query: {e}")
            raise OpsBrainException(f"Failed to encode query: {e}", code="QUERY_ENCODING_FAILED")

        # Query similarity from repository
        docs_repo = DocumentsRepository()
        try:
            results = docs_repo.hybrid_vector_search(query_vector, match_threshold=threshold, match_count=limit)
            return results
        except Exception as e:
            logger.error(f"Similarity vector search query failed: {e}")
            raise OpsBrainException(f"Vector search failed: {e}", code="VECTOR_SEARCH_FAILED")

    def reindex_document_with_retry(self, document_id: str, filepath: str, file_type: str, max_retries: int = 3) -> bool:
        docs_repo = DocumentsRepository()
        indexer = DocumentIndexer()

        # Extract and chunk
        text, file_metadata = indexer.extract_text_and_metadata(filepath, file_type)
        chunks = indexer.chunk_text(text, file_metadata)
        if not chunks:
            logger.warning(f"No chunks extracted from doc {document_id}")
            return True

        chunk_contents = [c["content"] for c in chunks]
        embeddings = self.generate_embeddings_batch(chunk_contents)

        # DB upload with backoff retry
        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"DB Write Attempt {attempt}/{max_retries} for doc {document_id}...")
                with docs_repo.get_cursor() as cur:
                    cur.execute("DELETE FROM document_chunks WHERE document_id = %s;", (document_id,))
                    for i, chunk in enumerate(chunks):
                        docs_repo.insert_chunk(
                            document_id=document_id,
                            content=chunk["content"],
                            embedding=embeddings[i],
                            page_number=chunk.get("page_number", 1)
                        )
                logger.info(f"Successfully reindexed doc {document_id} on attempt {attempt}")
                return True
            except Exception as e:
                logger.warning(f"DB Write failed on attempt {attempt}: {e}")
                if attempt == max_retries:
                    logger.error(f"Re-indexing failed after {max_retries} attempts.")
                    raise OpsBrainException(f"Reindexing upload failed: {e}", code="REINDEX_UPLOAD_FAILED")
                time.sleep(delay)
                delay *= 2.0
        return False
