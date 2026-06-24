import unittest
import os
from backend.services.rag import RAGService
from backend.repositories.documents import DocumentsRepository
from backend.config import logger

class TestRAGService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rag_service = RAGService()
        cls.docs_repo = DocumentsRepository()
        cls.test_doc = None
        
        # Purge existing documents to prevent test pollution
        logger.info("SetUpClass: Purging existing documents to clean database state...")
        with cls.docs_repo.get_cursor() as cur:
            cur.execute("DELETE FROM documents;")

    def test_1_rag_retrieval_and_join_query(self):
        logger.info("Test: Inserting mock document and verifying pgvector search joins...")
        
        # 1. Insert mock document
        self.__class__.test_doc = self.docs_repo.create_document(
            title="pump_safety_sop.txt",
            file_type="TXT",
            metadata={"status": "PROCESSING"}
        )
        doc_id = self.test_doc["id"]

        # 2. Add chunks manually with known embeddings
        chunks = [
            "Procedure: Open the primary suction line gate valve V-12. Inspect for visual leakage.",
            "Specs: Main Crude Pump P-101 operates at 1500 RPM with a design pressure limit of 150 PSI.",
            "Safety: Wear high-temperature gloves when servicing the heat exchanger unit 3 lines."
        ]
        
        embeddings_service = self.rag_service.embeddings_service
        embeddings = embeddings_service.generate_embeddings_batch(chunks)
        
        for i, content in enumerate(chunks):
            self.docs_repo.insert_chunk(
                document_id=doc_id,
                content=content,
                embedding=embeddings[i],
                page_number=i + 1
            )

        # 3. Retrieve chunks directly using EmbeddingService & joined DocumentsRepository
        # We query for P-101 RPM specs
        logger.info("Verifying hybrid retrieval join query...")
        retrieved = embeddings_service.search_similar_chunks("What is the pump RPM limit?", limit=2, threshold=0.3)
        self.assertGreater(len(retrieved), 0)
        
        # Ensure join works and yields title and file_type
        best_match = retrieved[0]
        self.assertIn("title", best_match)
        self.assertEqual(best_match["title"], "pump_safety_sop.txt")
        self.assertIn("file_type", best_match)
        self.assertEqual(best_match["file_type"], "TXT")
        self.assertIn("page_number", best_match)

    def test_2_rag_grounded_generation(self):
        logger.info("Test: Querying RAG and verifying grounded generation and citations...")
        self.assertIsNotNone(self.test_doc)

        # Query RAG
        result = self.rag_service.query_rag(
            query_text="What is the design pressure limit and RPM limit of Main Crude Pump P-101?",
            limit=2,
            threshold=0.3
        )

        logger.info(f"RAG Answer:\n{result['answer']}")
        logger.info(f"RAG Sources:\n{result['sources']}")

        # Verify citation & grounding
        self.assertTrue(result["grounded"])
        self.assertGreater(len(result["sources"]), 0)
        
        # Grounding checks: The LLM should answer P-101 specs and cite Source 1
        answer = result["answer"]
        self.assertIn("150 PSI", answer)
        self.assertIn("1500 RPM", answer)
        self.assertIn("[Source", answer) # Ensures citation format [Source X] is generated
        
        # Sources checks: Verifies the source contains the correct document title
        top_source = result["sources"][0]
        self.assertEqual(top_source["title"], "pump_safety_sop.txt")

    def test_3_rag_hallucination_prevention_fallback(self):
        logger.info("Test: Verifying hallucination prevention fallback...")
        
        # Query with an unrelated topic
        result = self.rag_service.query_rag(
            query_text="What is the capital of France?",
            limit=2,
            threshold=0.5
        )

        logger.info(f"Fallback Answer:\n{result['answer']}")

        # Fallback verification: Grounded should be False, and answer matches the strict error notice
        self.assertFalse(result["grounded"])
        self.assertEqual(result["sources"], [])
        self.assertEqual(result["answer"], "I could not find relevant information in the provided documentation.")

    @classmethod
    def tearDownClass(cls):
        if cls.test_doc:
            logger.info("TearDown: Purging mock RAG documents")
            with cls.docs_repo.get_cursor() as cur:
                cur.execute("DELETE FROM documents WHERE id = %s;", (cls.test_doc["id"],))

if __name__ == "__main__":
    unittest.main()
