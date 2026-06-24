import unittest
import json
from backend.services.graph import GraphService
from backend.models import KnowledgeNodeCreate, KnowledgeEdgeCreate, OpsBrainException
from backend.repositories.graph import GraphRepository
from backend.config import logger

class TestGraphService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.service = GraphService()
        cls.repo = GraphRepository()
        
        # Purge to clean test db state
        logger.info("SetUpClass: Purging existing graph nodes and edges...")
        with cls.repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

    def setUp(self):
        # Clean state for each test
        with self.repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")

    def test_1_node_crud(self):
        logger.info("Test: Performing Node CRUD operations...")
        
        # 1. Create Node
        node_in = KnowledgeNodeCreate(
            name="TEST-NODE-1",
            type="Vessel",
            metadata={"capacity": "100L", "rating": "150 PSI"}
        )
        node = self.service.create_node(node_in)
        self.assertIsNotNone(node["id"])
        self.assertEqual(node["name"], "TEST-NODE-1")
        self.assertEqual(node["type"], "Vessel")
        self.assertEqual(node["metadata"]["capacity"], "100L")
        
        # 2. Get Node
        node_id = node["id"]
        fetched = self.service.get_node(node_id)
        self.assertEqual(fetched["name"], "TEST-NODE-1")
        
        # 3. List Nodes with filters
        nodes_list = self.service.list_nodes(type="Vessel")
        self.assertEqual(len(nodes_list), 1)
        self.assertEqual(nodes_list[0]["name"], "TEST-NODE-1")
        
        # 4. Delete Node
        deleted = self.service.delete_node(node_id)
        self.assertTrue(deleted)
        
        # Verify node deleted
        with self.assertRaises(OpsBrainException) as context:
            self.service.get_node(node_id)
        self.assertEqual(context.exception.status_code, 404)

    def test_2_edge_crud_and_validation(self):
        logger.info("Test: Performing Edge CRUD and validation checks...")
        
        # Create two nodes
        n1 = self.service.create_node(KnowledgeNodeCreate(name="N1", type="Pump"))
        n2 = self.service.create_node(KnowledgeNodeCreate(name="N2", type="Valve"))
        
        # 1. Create valid edge
        edge_in = KnowledgeEdgeCreate(
            source_id=n1["id"],
            target_id=n2["id"],
            relation_type="FLOWS_TO",
            weight=1.0,
            metadata={"pipe_size": "2 inch"}
        )
        edge = self.service.create_edge(edge_in)
        self.assertIsNotNone(edge["id"])
        self.assertEqual(edge["source_id"], n1["id"])
        self.assertEqual(edge["target_id"], n2["id"])
        self.assertEqual(edge["relation_type"], "FLOWS_TO")
        self.assertEqual(float(edge["weight"]), 1.0)
        self.assertEqual(edge["metadata"]["pipe_size"], "2 inch")
        
        # 2. Prevent self-loop edges
        bad_edge_self = KnowledgeEdgeCreate(
            source_id=n1["id"],
            target_id=n1["id"],
            relation_type="FLOWS_TO"
        )
        with self.assertRaises(OpsBrainException) as context:
            self.service.create_edge(bad_edge_self)
        self.assertEqual(context.exception.code, "SELF_LOOP_FORBIDDEN")
        
        # 3. Prevent orphan edges (missing source node)
        bad_edge_orphan = KnowledgeEdgeCreate(
            source_id="00000000-0000-0000-0000-000000000000",
            target_id=n2["id"],
            relation_type="FLOWS_TO"
        )
        with self.assertRaises(OpsBrainException) as context:
            self.service.create_edge(bad_edge_orphan)
        self.assertEqual(context.exception.code, "SOURCE_NODE_NOT_FOUND")

    def test_3_neighborhood_and_shortest_path(self):
        logger.info("Test: Graph traversal and recursive CTE shortest path calculation...")
        
        # Set up a chain graph: A -> B -> C -> D
        # Path distance from A to D: 3 edges (A -> B -> C -> D)
        # Add another path: A -> D (direct connection)
        # Shortest path from A to D should be 1 edge (A -> D)
        
        na = self.service.create_node(KnowledgeNodeCreate(name="A", type="Vessel"))
        nb = self.service.create_node(KnowledgeNodeCreate(name="B", type="Pump"))
        nc = self.service.create_node(KnowledgeNodeCreate(name="C", type="Instrument"))
        nd = self.service.create_node(KnowledgeNodeCreate(name="D", type="Valve"))
        
        # Link A -> B
        self.service.create_edge(KnowledgeEdgeCreate(source_id=na["id"], target_id=nb["id"], relation_type="FLOWS_TO"))
        # Link B -> C
        self.service.create_edge(KnowledgeEdgeCreate(source_id=nb["id"], target_id=nc["id"], relation_type="FLOWS_TO"))
        # Link C -> D
        self.service.create_edge(KnowledgeEdgeCreate(source_id=nc["id"], target_id=nd["id"], relation_type="FLOWS_TO"))
        
        # 1. Check neighborhood of A up to depth 2 (should return A, B, C nodes and A->B, B->C edges)
        neighborhood = self.service.get_neighborhood(node_id=na["id"], depth=2)
        node_names = [n["name"] for n in neighborhood["nodes"]]
        self.assertIn("A", node_names)
        self.assertIn("B", node_names)
        self.assertIn("C", node_names)
        self.assertNotIn("D", node_names) # D is depth 3 away
        self.assertEqual(len(neighborhood["edges"]), 2)
        
        # 2. Check shortest path from A to D (depth 3)
        path_info = self.service.get_shortest_path(source_id=na["id"], target_id=nd["id"])
        self.assertTrue(path_info["connected"])
        self.assertEqual(path_info["depth"], 3)
        self.assertEqual(path_info["path_names"], ["A", "B", "C", "D"])
        
        # 3. Add direct edge A -> D and verify shortest path changes to depth 1
        self.service.create_edge(KnowledgeEdgeCreate(source_id=na["id"], target_id=nd["id"], relation_type="FLOWS_TO"))
        path_info_updated = self.service.get_shortest_path(source_id=na["id"], target_id=nd["id"])
        self.assertEqual(path_info_updated["depth"], 1)
        self.assertEqual(path_info_updated["path_names"], ["A", "D"])

    @classmethod
    def tearDownClass(cls):
        logger.info("TearDownClass: Purging test graph nodes and edges...")
        with cls.repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

if __name__ == "__main__":
    unittest.main()
