import unittest
import os
from backend.services.embeddings import EmbeddingService
from backend.repositories.documents import DocumentsRepository
from backend.config import logger

class TestEmbeddingsService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.embeddings_service = EmbeddingService()
        cls.docs_repo = DocumentsRepository()
        cls.test_doc = None

    def test_1_batch_embedding_generation(self):
        logger.info("Test: Generating batch embeddings...")
        texts = [
            "Always inspect valve V-12 before crude pump startup.",
            "Maximum pressure of pump P-101 is 150 PSI.",
            "Technician Amit reported a seal leak on Valve V-12."
        ]
        embeddings = self.embeddings_service.generate_embeddings_batch(texts)
        self.assertEqual(len(embeddings), 3)
        for vector in embeddings:
            self.assertEqual(len(vector), 384)

    def test_2_similarity_search(self):
        logger.info("Test: Testing similarity vector search...")
        
        # 1. Insert mock document
        self.__class__.test_doc = self.docs_repo.create_document(
            title="mock_manual.txt",
            file_type="TXT",
            metadata={"status": "PROCESSING"}
        )
        doc_id = self.test_doc["id"]

        # 2. Add chunks manually
        chunks = [
            "Procedure: Open the primary suction line gate valve V-12. Inspect for visual leakage.",
            "Specs: Main Crude Pump P-101 operates at 1500 RPM with a design pressure limit of 150 PSI.",
            "Safety: Wear high-temperature gloves when servicing the heat exchanger unit 3 lines."
        ]
        embeddings = self.embeddings_service.generate_embeddings_batch(chunks)
        
        for i, content in enumerate(chunks):
            self.docs_repo.insert_chunk(
                document_id=doc_id,
                content=content,
                embedding=embeddings[i],
                page_number=1
            )

        # 3. Perform similarity query
        # Searching for "pump RPM specs" should match the second chunk
        logger.info("Searching for: 'What is the pump RPM limit?'")
        results = self.embeddings_service.search_similar_chunks("What is the pump RPM limit?", limit=2, threshold=0.3)
        self.assertGreater(len(results), 0)
        
        best_match = results[0]["content"]
        logger.info(f"Top search hit: {best_match}")
        self.assertIn("P-101", best_match)
        self.assertIn("1500 RPM", best_match)

    def test_3_reindexing_with_retry(self):
        logger.info("Test: Re-indexing with retry...")
        self.assertIsNotNone(self.test_doc)
        doc_id = self.test_doc["id"]

        # Create local file for re-indexing
        filepath = os.path.join(os.path.dirname(__file__), "mock_manual_reindex.txt")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("New re-indexed content.\nValve V-12 operates under standard pressure.")

        # Trigger re-index
        success = self.embeddings_service.reindex_document_with_retry(
            document_id=doc_id,
            filepath=filepath,
            file_type="TXT"
        )
        self.assertTrue(success)

        # Clean up local file
        if os.path.exists(filepath):
            os.remove(filepath)

        # Check DB that chunks updated
        with self.docs_repo.get_cursor() as cur:
            cur.execute("SELECT * FROM document_chunks WHERE document_id = %s;", (doc_id,))
            chunks = cur.fetchall()
            self.assertEqual(len(chunks), 1)
            self.assertIn("New re-indexed content", chunks[0]["content"])

    @classmethod
    def tearDownClass(cls):
        if cls.test_doc:
            logger.info("TearDown: Purging mock documents")
            with cls.docs_repo.get_cursor() as cur:
                cur.execute("DELETE FROM documents WHERE id = %s;", (cls.test_doc["id"],))

if __name__ == "__main__":
    unittest.main()
