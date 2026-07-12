import unittest
import os
import json
import time
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.repositories.assets import AssetsRepository
from backend.repositories.compliance import ComplianceRepository
from backend.database import get_db_connection, release_db_connection

class TestRefineryScenario(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.assets_repo = AssetsRepository()
        cls.compliance_repo = ComplianceRepository()
        # Pre-heat the client to boot FastAPI app and initialize database connections
        try:
            cls.client.get("/api/v1/health")
        except Exception as e:
            print("Pre-heat warning:", e)

    def test_1_seed_refinery_flow(self):
        # Verify no embedding calls are made during seed
        with patch('backend.indexer.DocumentIndexer.generate_embeddings') as mock_embeddings:
            start_time = time.perf_counter()
            response = self.client.post("/api/v1/demo/seed-refinery")
            duration = time.perf_counter() - start_time
            
            # 1. seed-refinery endpoint exists and returns success
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["data"]["assets_count"], 6)
            
            # 9. No seed timeout (checking < 25.0s to handle slow emulator cold starts safely)
            self.assertLess(duration, 25.0, f"Refinery seeding took too long: {duration:.2f}s")
            
            # 10. No LLM/embedding calls are required during refinery seed
            mock_embeddings.assert_not_called()

        # 2. Exactly 6 refinery assets are created
        assets = self.assets_repo.get_all_assets()
        self.assertEqual(len(assets), 6)
        
        # 3. Expected refinery asset tags exist: RPS-1, TK-501, P-101, M-101, VLV-201, PT-301
        tags = {asset["tag_number"] for asset in assets}
        expected_tags = {"RPS-1", "TK-501", "P-101", "M-101", "VLV-201", "PT-301"}
        self.assertEqual(tags, expected_tags)

        # 4. Expected graph edges exist
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT kn1.name AS src, kn2.name AS tgt, ke.relation_type
                FROM knowledge_edges ke
                JOIN knowledge_nodes kn1 ON ke.source_id = kn1.id
                JOIN knowledge_nodes kn2 ON ke.target_id = kn2.id;
            """)
            edges = cur.fetchall()
            # Standard cursor returns tuples: e[0]=src, e[1]=tgt, e[2]=relation_type
            edge_tuples = {(e[0], e[1], e[2]) for e in edges}
            expected_edges = {
                ("TK-501", "P-101", "FLOWS_TO"),
                ("P-101", "VLV-201", "FLOWS_TO"),
                ("P-101", "M-101", "DRIVEN_BY"),
                ("PT-301", "P-101", "MEASURES"),
                ("VLV-201", "RPS-1", "PROTECTS_OR_ISOLATES")
            }
            self.assertEqual(edge_tuples, expected_edges)

            # 5. Compliance case exists for P-101
            cur.execute("""
                SELECT cr.status, cr.findings 
                FROM compliance_records cr 
                JOIN assets a ON cr.asset_id = a.id 
                WHERE a.tag_number = 'P-101';
            """)
            comp = cur.fetchone()
            self.assertIsNotNone(comp)
            # comp[0]=status, comp[1]=findings
            self.assertEqual(comp[0], "NON_COMPLIANT")
            self.assertIn("18 bar", comp[1])

            # 6. Tribal note exists for PT-301
            cur.execute("SELECT note_text, author_role, confidence FROM tribal_knowledge_notes WHERE asset_tag = 'PT-301';")
            note = cur.fetchone()
            self.assertIsNotNone(note)
            # note[0]=note_text, note[1]=author_role, note[2]=confidence
            self.assertEqual(note[1], "Senior Operator")
            self.assertEqual(note[2], "Repeated field observation")
            self.assertIn("gauge", note[0])
            
            cur.close()
        finally:
            release_db_connection(conn)

    def test_2_benchmark_questions_json(self):
        # 7. BQ-018 and BQ-019 exist in benchmark_questions.json
        filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "benchmark_questions.json")
        with open(filepath, "r", encoding="utf-8") as f:
            questions = json.load(f)
            
        q_ids = {q["id"] for q in questions}
        self.assertIn("BQ-018", q_ids)
        self.assertIn("BQ-019", q_ids)
        
        bq18 = next(q for q in questions if q["id"] == "BQ-018")
        self.assertEqual(bq18["category"], "Asset relationship")
        self.assertEqual(bq18["question"], "What asset does PT-301 measure in the refinery pump station?")
        self.assertEqual(bq18["expected_assets"], ["PT-301", "P-101"])
        
        bq19 = next(q for q in questions if q["id"] == "BQ-019")
        self.assertEqual(bq19["category"], "Compliance threshold")
        self.assertEqual(bq19["expected_assets"], ["P-101", "VLV-201", "PT-301", "M-101"])

    def test_3_restore_vizag_scenario(self):
        # 8. Calling Vizag seed after refinery seed restores Vizag dataset
        # Trigger vizag seed
        response = self.client.post("/api/v1/demo/seed-vizag")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        
        # Verify 8 vizag assets exist and no refinery assets remain
        assets = self.assets_repo.get_all_assets()
        self.assertEqual(len(assets), 8)
        tags = {asset["tag_number"] for asset in assets}
        self.assertIn("COB-1", tags)
        self.assertNotIn("RPS-1", tags)
        self.assertNotIn("TK-501", tags)
        self.assertNotIn("PT-301", tags)

if __name__ == "__main__":
    unittest.main()
