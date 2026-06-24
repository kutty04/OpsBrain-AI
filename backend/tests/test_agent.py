import unittest
from unittest.mock import MagicMock, patch
import json
from backend.services.graph import GraphService
from backend.services.rag import RAGService
from backend.repositories.graph import GraphRepository
from backend.agents.router import GroqAgentRouter, RoutingDecision
from backend.agents.tools import AgentToolExecutor
from backend.models import OpsBrainException, KnowledgeNodeCreate, KnowledgeEdgeCreate
from backend.config import logger

class TestAgentRouterAndExecutor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.router = GroqAgentRouter()
        cls.executor = AgentToolExecutor()
        cls.graph_service = GraphService()
        cls.graph_repo = GraphRepository()
        
        # Purge to clean test db state
        logger.info("SetUpClass: Purging existing graph nodes/edges...")
        with cls.graph_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

    def setUp(self):
        with self.graph_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")

    @patch('groq.resources.chat.completions.Completions.create')
    def test_1_general_conversation_routing(self, mock_create):
        logger.info("Test: General conversation routing...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "intent": "GENERAL_CONVERSATION",
                "confidence_score": 0.99,
                "parameters": {},
                "reply_message": "Hello! I am your plant digital twin operations assistant."
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Call router
        decision = self.router.route_prompt("Hello there!")
        self.assertEqual(decision.intent, "GENERAL_CONVERSATION")
        self.assertEqual(decision.reply_message, "Hello! I am your plant digital twin operations assistant.")
        
        # Execute tool
        res = self.executor.execute_tool(decision.intent, decision.parameters, decision.reply_message)
        self.assertEqual(res["answer"], "Hello! I am your plant digital twin operations assistant.")

    @patch('groq.resources.chat.completions.Completions.create')
    @patch('backend.services.rag.RAGService.query_rag')
    def test_2_rag_query_routing(self, mock_query_rag, mock_create):
        logger.info("Test: RAG query routing...")
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "intent": "RAG_QUERY",
                "confidence_score": 0.95,
                "parameters": {
                    "query": "Main Crude Pump P-101 design pressure limit"
                }
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Mock RAG response
        mock_query_rag.return_value = {
            "answer": "The design pressure limit of P-101 is 150 PSI.",
            "sources": [{"title": "pump_sop.txt", "page_number": 2}]
        }
        
        # Route and Execute
        decision = self.router.route_prompt("What is the design pressure limit of Main Crude Pump P-101?")
        self.assertEqual(decision.intent, "RAG_QUERY")
        self.assertEqual(decision.parameters["query"], "Main Crude Pump P-101 design pressure limit")
        
        res = self.executor.execute_tool(decision.intent, decision.parameters)
        self.assertEqual(res["answer"], "The design pressure limit of P-101 is 150 PSI.")
        self.assertEqual(len(res["sources"]), 1)
        mock_query_rag.assert_called_once_with(query_text="Main Crude Pump P-101 design pressure limit", limit=3, threshold=0.35)

    @patch('groq.resources.chat.completions.Completions.create')
    def test_3_graph_shortest_path_routing(self, mock_create):
        logger.info("Test: Graph shortest path routing...")
        
        # Setup nodes
        n1 = self.graph_service.create_node(KnowledgeNodeCreate(name="TK-101", type="Vessel"))
        n2 = self.graph_service.create_node(KnowledgeNodeCreate(name="FIC-101", type="Instrument"))
        self.graph_service.create_edge(KnowledgeEdgeCreate(source_id=n1["id"], target_id=n2["id"], relation_type="FLOWS_TO"))
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "intent": "GRAPH_QUERY",
                "confidence_score": 0.98,
                "parameters": {
                    "action": "shortest_path",
                    "source_tag": "TK-101",
                    "target_tag": "FIC-101"
                }
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Route and Execute
        decision = self.router.route_prompt("shortest path from TK-101 to FIC-101")
        self.assertEqual(decision.intent, "GRAPH_QUERY")
        self.assertEqual(decision.parameters["action"], "shortest_path")
        
        res = self.executor.execute_tool(decision.intent, decision.parameters)
        self.assertIn("The shortest path from TK-101 to FIC-101 has 1 hop(s)", res["answer"])
        self.assertEqual(res["details"]["path_names"], ["TK-101", "FIC-101"])

    @patch('groq.resources.chat.completions.Completions.create')
    def test_4_graph_neighborhood_routing(self, mock_create):
        logger.info("Test: Graph neighborhood routing...")
        
        # Setup nodes
        n1 = self.graph_service.create_node(KnowledgeNodeCreate(name="E-101", type="Exchanger"))
        n2 = self.graph_service.create_node(KnowledgeNodeCreate(name="TV-101", type="Valve"))
        self.graph_service.create_edge(KnowledgeEdgeCreate(source_id=n1["id"], target_id=n2["id"], relation_type="FLOWS_TO"))
        
        # Mock Groq response
        mock_resp = MagicMock()
        mock_resp.choices = [
            MagicMock(message=MagicMock(content=json.dumps({
                "intent": "GRAPH_QUERY",
                "confidence_score": 0.96,
                "parameters": {
                    "action": "neighborhood",
                    "start_tag": "E-101",
                    "depth": 2
                }
            })))
        ]
        mock_create.return_value = mock_resp
        
        # Route and Execute
        decision = self.router.route_prompt("what is connected to E-101?")
        self.assertEqual(decision.intent, "GRAPH_QUERY")
        self.assertEqual(decision.parameters["action"], "neighborhood")
        
        res = self.executor.execute_tool(decision.intent, decision.parameters)
        self.assertIn("Found 2 connected nodes around E-101", res["answer"])
        self.assertEqual(len(res["details"]["nodes"]), 2)

    @classmethod
    def tearDownClass(cls):
        logger.info("TearDownClass: Purging test graph nodes/edges...")
        with cls.graph_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

if __name__ == "__main__":
    unittest.main()
