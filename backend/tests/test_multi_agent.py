import unittest
from unittest.mock import MagicMock, patch
import json
from backend.services.graph import GraphService
from backend.repositories.assets import AssetsRepository
from backend.repositories.graph import GraphRepository
from backend.agents.specialized import (
    KnowledgeAgent,
    RCAAgent,
    ComplianceAgent,
    LessonsLearnedAgent,
    RiskAgent
)
from backend.models import OpsBrainException, KnowledgeNodeCreate
from backend.config import logger

class TestMultiAgentSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.knowledge_agent = KnowledgeAgent()
        cls.rca_agent = RCAAgent()
        cls.compliance_agent = ComplianceAgent()
        cls.lessons_learned_agent = LessonsLearnedAgent()
        cls.risk_agent = RiskAgent()
        
        cls.assets_repo = AssetsRepository()
        cls.graph_repo = GraphRepository()
        cls.graph_service = GraphService()
        
        # Purge to clean test db state
        logger.info("SetUpClass: Purging existing graph/assets...")
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM asset_risk_scores;")
            cur.execute("DELETE FROM incidents;")
            cur.execute("DELETE FROM assets;")

    def setUp(self):
        with self.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM asset_risk_scores;")
            cur.execute("DELETE FROM incidents;")
            cur.execute("DELETE FROM assets;")

    @patch('groq.resources.chat.completions.Completions.create')
    def test_1_knowledge_agent(self, mock_create):
        logger.info("Test: Running Knowledge Agent...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "answer": "Storage Tank TK-101 has a volume of 50m3 and is connected downstream to Valve XV-101.",
                "confidence": 0.95,
                "related_tags": ["TK-101", "XV-101"]
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Setup test asset
        asset = self.assets_repo.create_asset(tag_number="TK-101", name="Storage Tank", category="Vessel")
        self.graph_service.create_node(KnowledgeNodeCreate(name="TK-101", type="Vessel", asset_id=asset["id"]))
        
        result = self.knowledge_agent.execute(
            user_query="Tell me about TK-101 specs and connections.",
            context_data={"tag_number": "TK-101"}
        )
        self.assertEqual(result["confidence"], 0.95)
        self.assertIn("TK-101", result["related_tags"])
        self.assertIn("XV-101", result["related_tags"])

    @patch('groq.resources.chat.completions.Completions.create')
    def test_2_rca_agent(self, mock_create):
        logger.info("Test: Running RCA Agent...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "identified_root_cause": "Thermal stress on the heat exchanger tubes due to steam valve leakage.",
                "contributing_factors": ["Valve XV-201 leaked steam continuously", "Tubes overheated"],
                "suggested_mitigations": ["Replace valve seals", "Install temperature alarm"],
                "severity_assessment": "High"
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Setup test asset
        asset = self.assets_repo.create_asset(tag_number="E-101", name="Heat Exchanger", category="Exchanger")
        self.graph_service.create_node(KnowledgeNodeCreate(name="E-101", type="Exchanger", asset_id=asset["id"]))
        
        result = self.rca_agent.execute(
            user_query="Investigate heat exchanger E-101 tube rupture.",
            context_data={"tag_number": "E-101"}
        )
        self.assertEqual(result["severity_assessment"], "High")
        self.assertEqual(len(result["contributing_factors"]), 2)

    @patch('groq.resources.chat.completions.Completions.create')
    def test_3_compliance_agent(self, mock_create):
        logger.info("Test: Running Compliance Agent...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "status": "NON_COMPLIANT",
                "violations": ["OSHA 1910.119 Safety Limit Exceeded"],
                "findings": "Pressure safety valve PSV-101 was found stuck closed during test."
            })))
        ]
        mock_create.return_value = mock_resp
        
        asset = self.assets_repo.create_asset(tag_number="PSV-101", name="Safety Valve", category="Valve")
        self.graph_service.create_node(KnowledgeNodeCreate(name="PSV-101", type="Valve", asset_id=asset["id"]))
        
        result = self.compliance_agent.execute(
            user_query="Analyze compliance status for PSV-101.",
            context_data={"tag_number": "PSV-101"}
        )
        self.assertEqual(result["status"], "NON_COMPLIANT")
        self.assertIn("OSHA 1910.119 Safety Limit Exceeded", result["violations"])

    @patch('groq.resources.chat.completions.Completions.create')
    def test_4_lessons_learned_agent(self, mock_create):
        logger.info("Test: Running Lessons Learned Agent...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "lessons_extracted": ["Regular valve maintenance prevents blockages"],
                "preventive_actions": ["Implement monthly limit testing"],
                "safety_recommendations": ["Upgrade to corrosion resistant materials"]
            })))
        ]
        mock_create.return_value = mock_resp
        
        result = self.lessons_learned_agent.execute(user_query="What lessons can we learn from block valve wear?")
        self.assertEqual(len(result["lessons_extracted"]), 1)

    @patch('groq.resources.chat.completions.Completions.create')
    def test_5_risk_agent_and_database_commit(self, mock_create):
        logger.info("Test: Running Risk Agent and verifying DB score updates...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "calculated_score": 75,
                "risk_level": "High",
                "explanation": "Calculated risk based on active incidents and lack of recent maintenance."
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Setup test asset
        asset = self.assets_repo.create_asset(tag_number="P-101", name="Crude Pump", category="Pump")
        self.graph_service.create_node(KnowledgeNodeCreate(name="P-101", type="Pump", asset_id=asset["id"]))
        
        result = self.risk_agent.execute(
            user_query="Evaluate risk profile for crude pump P-101.",
            context_data={"tag_number": "P-101"}
        )
        self.assertEqual(result["calculated_score"], 75)
        self.assertEqual(result["risk_level"], "High")
        
        # Verify that the score was committed to database by the Risk Agent!
        db_score = self.assets_repo.get_latest_risk_score(asset["id"])
        self.assertIsNotNone(db_score)
        self.assertEqual(db_score["risk_score"], 75)
        self.assertEqual(db_score["risk_level"], "High")
        self.assertIn("Calculated risk based on active incidents", db_score["explanation"])

    @classmethod
    def tearDownClass(cls):
        logger.info("TearDownClass: Purging test assets/graph...")
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM asset_risk_scores;")
            cur.execute("DELETE FROM incidents;")
            cur.execute("DELETE FROM assets;")

if __name__ == "__main__":
    unittest.main()
