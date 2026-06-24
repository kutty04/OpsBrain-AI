import unittest
import os
import time
from fastapi.testclient import TestClient
from backend.main import app
from backend.repositories.documents import DocumentsRepository
from backend.config import logger

class TestIngestionLayer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.docs_repo = DocumentsRepository()
        cls.test_files = []

    def create_mock_file(self, filename: str, content: bytes) -> str:
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, "wb") as f:
            f.write(content)
        self.test_files.append(filepath)
        return filepath

    def test_1_ingest_txt_file(self):
        logger.info("Test: Uploading mock TXT file...")
        filepath = self.create_mock_file("mock_sop.txt", b"This is Section 1.\nAlways inspect valve V-12 before crude pump startup.\nThis is Section 2.\nMaximum pressure of pump P-101 is 150 PSI.")
        
        with open(filepath, "rb") as f:
            response = self.client.post(
                "/api/v1/ingest/document",
                files={"file": (os.path.basename(filepath), f, "text/plain")}
            )
            
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        
        doc_id = json_data["data"]["document_id"]
        self.assertIsNotNone(doc_id)
        
        # Poll database for completion (wait up to 15 seconds for background embedding model)
        logger.info("Polling database for processed status...")
        processed = False
        for _ in range(15):
            time.sleep(1)
            with self.docs_repo.get_cursor() as cur:
                cur.execute("SELECT metadata FROM documents WHERE id = %s;", (doc_id,))
                row = cur.fetchone()
                if row and row["metadata"].get("status") == "PROCESSED":
                    processed = True
                    break
                    
        self.assertTrue(processed, "Document processing timed out or failed in the background.")
        
        # Verify chunks exist and have correct BGE-384 vectors
        with self.docs_repo.get_cursor() as cur:
            cur.execute("SELECT * FROM document_chunks WHERE document_id = %s;", (doc_id,))
            chunks = cur.fetchall()
            logger.info(f"Ingested chunks verified: {len(chunks)} chunks found in database.")
            self.assertGreater(len(chunks), 0)
            
            # Verify BGE vector length is 384
            # Select embedding as text to avoid direct float[] cast constraints in psycopg2
            cur.execute("SELECT embedding::text FROM document_chunks WHERE document_id = %s LIMIT 1;", (doc_id,))
            row = cur.fetchone()
            self.assertIsNotNone(row)
            vector_str = row["embedding"] if isinstance(row, dict) else row[0]
            vector = [float(x) for x in vector_str.strip("[]").split(",")]
            self.assertEqual(len(vector), 384, f"Embedding vector dimension is {len(vector)}, expected 384.")

    @classmethod
    def tearDownClass(cls):
        logger.info("TearDown: Cleaning up ingestion records and mock files")
        # Purge test files
        for filepath in cls.test_files:
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.error(f"Failed to remove test file: {e}")
                    
        # Purge database records
        with cls.docs_repo.get_cursor() as cur:
            cur.execute("DELETE FROM documents WHERE title = 'mock_sop.txt';")

if __name__ == "__main__":
    unittest.main()
