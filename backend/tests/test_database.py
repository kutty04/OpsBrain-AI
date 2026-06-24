import unittest
from backend.repositories.assets import AssetsRepository
from backend.repositories.graph import GraphRepository
from backend.repositories.documents import DocumentsRepository
from backend.config import logger

class TestDatabaseLayer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assets_repo = AssetsRepository()
        cls.graph_repo = GraphRepository()
        cls.docs_repo = DocumentsRepository()

    def test_1_create_and_fetch_asset(self):
        logger.info("Test: Creating asset P-101")
        asset = self.assets_repo.create_asset(
            tag_number="P-101",
            name="Main Crude Pump",
            category="Pump",
            description="Primary crude feed pump for Unit 1"
        )
        self.assertEqual(asset["tag_number"], "P-101")
        self.assertEqual(asset["category"], "Pump")

        # Fetch asset
        fetched = self.assets_repo.get_asset_by_tag("P-101")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["name"], "Main Crude Pump")

    def test_2_graph_traversal(self):
        logger.info("Test: Building graph nodes and edges")
        
        # Fetch asset ID
        asset = self.assets_repo.get_asset_by_tag("P-101")
        self.assertIsNotNone(asset)
        asset_id = asset["id"]

        # Create nodes
        node_asset = self.graph_repo.create_node(
            name="P-101",
            type="Asset",
            asset_id=asset_id,
            metadata={"category": "Pump"}
        )
        node_sop = self.graph_repo.create_node(
            name="SOP-12",
            type="Document",
            metadata={"title": "Crude Pump Operation SOP"}
        )
        node_regulation = self.graph_repo.create_node(
            name="OISD-117",
            type="Regulation",
            metadata={"title": "Safety Standards for Pumps"}
        )

        # Create edges
        edge_1 = self.graph_repo.create_edge(
            source_id=node_sop["id"],
            target_id=node_asset["id"],
            relation_type="GOVERNS"
        )
        edge_2 = self.graph_repo.create_edge(
            source_id=node_regulation["id"],
            target_id=node_sop["id"],
            relation_type="GOVERNS"
        )

        # Query graph neighborhood at depth 2
        graph = self.graph_repo.get_graph_neighborhood(asset_id=asset_id, depth=2)
        logger.info(f"Fetched graph neighborhood: {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")
        
        # Verify node counts
        node_names = [n["name"] for n in graph["nodes"]]
        self.assertIn("P-101", node_names)
        self.assertIn("SOP-12", node_names)
        self.assertIn("OISD-117", node_names)
        self.assertEqual(len(graph["nodes"]), 3)
        self.assertEqual(len(graph["edges"]), 2)

    def test_3_risk_score_storage(self):
        logger.info("Test: Creating risk scores")
        asset = self.assets_repo.get_asset_by_tag("P-101")
        self.assertIsNotNone(asset)
        asset_id = asset["id"]

        # Write risk score
        risk = self.assets_repo.create_or_update_risk_score(
            asset_id=asset_id,
            risk_score=75,
            risk_level="HIGH",
            explanation="Unusual bearing vibrations reported during last shift"
        )
        self.assertEqual(risk["risk_score"], 75)
        self.assertEqual(risk["risk_level"], "HIGH")

        # Fetch latest
        latest = self.assets_repo.get_latest_risk_score(asset_id)
        self.assertIsNotNone(latest)
        self.assertEqual(latest["risk_score"], 75)

    @classmethod
    def tearDownClass(cls):
        # Optional clean up of graph and test assets
        logger.info("TearDown: Cleaning up test nodes and assets")
        # Since cascaded deletes are active, deleting the asset will purge dependents
        # psycopg2 raw execution for quick tear down
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM assets WHERE tag_number = 'P-101';")
            cur.execute("DELETE FROM knowledge_nodes WHERE name IN ('SOP-12', 'OISD-117');")

if __name__ == "__main__":
    unittest.main()
