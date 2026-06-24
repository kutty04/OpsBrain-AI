from typing import List, Optional, Dict, Any
from backend.repositories.base import BaseRepository
import json

class DocumentsRepository(BaseRepository):
    def create_document(self, title: str, file_type: str, file_path: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict:
        query = """
            INSERT INTO documents (title, file_type, file_path, metadata)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """
        metadata_json = json.dumps(metadata) if metadata else None
        with self.get_cursor() as cur:
            cur.execute(query, (title, file_type, file_path, metadata_json))
            return dict(cur.fetchone())

    def insert_chunk(self, document_id: str, content: str, embedding: List[float], page_number: Optional[int] = None) -> Dict:
        query = """
            INSERT INTO document_chunks (document_id, content, embedding, page_number)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (document_id, content, embedding, page_number))
            return dict(cur.fetchone())

    def hybrid_vector_search(self, query_embedding: List[float], match_threshold: float = 0.5, match_count: int = 5) -> List[Dict]:
        # Join with documents to retrieve title and file_type for source traceability and citations
        query = """
            SELECT m.*, d.title, d.file_type 
            FROM match_document_chunks(%s::vector, %s, %s) m
            LEFT JOIN documents d ON d.id = m.document_id;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (query_embedding, match_threshold, match_count))
            return [dict(row) for row in cur.fetchall()]

    def get_all_documents(self) -> List[Dict]:
        query = "SELECT * FROM documents ORDER BY created_at DESC;"
        with self.get_cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]
