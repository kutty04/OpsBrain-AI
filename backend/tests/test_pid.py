import unittest
from unittest.mock import MagicMock, patch
import json
from backend.services.pid import PIDParsingService
from backend.repositories.assets import AssetsRepository
from backend.repositories.graph import GraphRepository
from backend.config import logger

class TestPIDParsingService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pid_service = PIDParsingService()
        cls.assets_repo = AssetsRepository()
        cls.graph_repo = GraphRepository()
        
        # Purge existing data to avoid test pollution
        logger.info("SetUpClass: Purging existing assets/nodes/edges...")
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

    def test_1_pid_parsing_and_db_insertion(self):
        logger.info("Test: Parsing P&ID image and inserting topology with mocks...")

        # Mock JSON response from Gemini Vision
        mock_extraction = {
            "assets": [
                { "tag_number": "TK-101", "name": "Storage Tank", "category": "Vessel", "description": "Feed Storage Tank", "confidence_score": 0.98 },
                { "tag_number": "XV-101", "name": "On/Off Valve", "category": "Valve", "description": "Normally Closed Feed block valve", "confidence_score": 0.95 },
                { "tag_number": "FT-101", "name": "Flow Transmitter", "category": "Instrument", "description": "Flow meter sensor", "confidence_score": 0.96 },
                { "tag_number": "FIC-101", "name": "Flow Indicating Controller", "category": "Instrument", "description": "Flow controller loop 101", "confidence_score": 0.94 },
                { "tag_number": "FV-101", "name": "Flow Control Valve", "category": "Valve", "description": "Main feed control valve", "confidence_score": 0.97 },
                # Low confidence asset (should be skipped)
                { "tag_number": "PT-999", "name": "Low Confidence PT", "category": "Instrument", "description": "Bad read", "confidence_score": 0.45 },
                # Bad tag format (should be skipped)
                { "tag_number": "BAD_TAG_FORMAT", "name": "Bad Tag", "category": "Vessel", "description": "No dash", "confidence_score": 0.99 }
            ],
            "connections": [
                { "source_tag": "TK-101", "target_tag": "XV-101", "relation_type": "FLOWS_TO", "confidence_score": 0.95 },
                { "source_tag": "XV-101", "target_tag": "FT-101", "relation_type": "FLOWS_TO", "confidence_score": 0.95 },
                { "source_tag": "FT-101", "target_tag": "FV-101", "relation_type": "FLOWS_TO", "confidence_score": 0.94 },
                # Self-loop connection (should be skipped)
                { "source_tag": "FV-101", "target_tag": "FV-101", "relation_type": "FLOWS_TO", "confidence_score": 0.98 },
                # Orphan Target: R-101 is not in assets, should auto-create Line category placeholder
                { "source_tag": "FV-101", "target_tag": "R-101", "relation_type": "FLOWS_TO", "confidence_score": 0.96 },
                # Control loop edge
                { "source_tag": "FT-101", "target_tag": "FIC-101", "relation_type": "MEASURES", "confidence_score": 0.95 },
                { "source_tag": "FIC-101", "target_tag": "FV-101", "relation_type": "CONTROLS", "confidence_score": 0.95 }
            ]
        }

        # Mock the models.generate_content call
        mock_response = MagicMock()
        mock_response.text = json.dumps(mock_extraction)

        with patch.object(self.pid_service.client.models, 'generate_content', return_value=mock_response) as mock_generate:
            result = self.pid_service.parse_pid_image(b"mock_image_bytes", "image/png")
            
            mock_generate.assert_called_once()
            
            logger.info(f"Database insertion count results: {result}")
            
            # Assertions:
            # - Valid assets in JSON: TK-101, XV-101, FT-101, FIC-101, FV-101 (Total = 5)
            # - Auto-created placeholder for orphan target R-101 (Total = 1)
            # - Total assets created = 6
            self.assertEqual(result["assets_created"], 6)
            
            # - Total nodes created = 6
            self.assertEqual(result["nodes_created"], 6)
            
            # - Valid connections:
            #   1. TK-101 -> XV-101 (FLOWS_TO)
            #   2. XV-101 -> FT-101 (FLOWS_TO)
            #   3. FT-101 -> FV-101 (FLOWS_TO)
            #   4. FV-101 -> R-101 (FLOWS_TO)
            #   5. FT-101 -> FIC-101 (MEASURES)
            #   6. FIC-101 -> FV-101 (CONTROLS)
            # - Self-loop FV-101 -> FV-101 skipped.
            # - Total edges created = 6
            self.assertEqual(result["edges_created"], 6)

        # 4. Verify DB content via Repositories
        assets = self.assets_repo.get_all_assets()
        tags = [a["tag_number"] for a in assets]
        self.assertIn("TK-101", tags)
        self.assertIn("R-101", tags)
        self.assertNotIn("PT-999", tags) # Low confidence skipped
        self.assertNotIn("BAD_TAG_FORMAT", tags) # Regex format skipped

        # Verify placeholder tag properties
        r101_asset = self.assets_repo.get_asset_by_tag("R-101")
        self.assertEqual(r101_asset["category"], "Line")
        self.assertEqual(r101_asset["name"], "Placeholder R-101")

        # Verify graph neighborhood traversal
        graph_data = self.graph_repo.get_graph_neighborhood(r101_asset["id"], depth=3)
        logger.info(f"Traversed graph neighborhood: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges")
        self.assertGreater(len(graph_data["nodes"]), 1)

    @classmethod
    def tearDownClass(cls):
        logger.info("TearDown: Purging test assets/nodes/edges...")
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM knowledge_edges;")
            cur.execute("DELETE FROM knowledge_nodes;")
            cur.execute("DELETE FROM assets;")

if __name__ == "__main__":
    unittest.main()
