import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.repositories.assets import AssetsRepository
from backend.config import logger

class TestSystemEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.assets_repo = AssetsRepository()

    def test_complete_operations_workflow(self):
        logger.info("==============================================")
        logger.info("     OPSBRAIN SYSTEM END-TO-END WORKFLOW     ")
        logger.info("==============================================")

        # Step 1: Trigger the seeder to reset database to Vizag Coke Oven Battery scenario
        logger.info("Step 1: Invoking /api/v1/demo/seed-vizag...")
        seed_resp = self.client.post("/api/v1/demo/seed-vizag")
        self.assertEqual(seed_resp.status_code, 200)
        seed_body = seed_resp.json()
        self.assertTrue(seed_body["success"])
        self.assertEqual(seed_body["data"]["assets_count"], 8)
        logger.info("Scenario seeded successfully with 8 assets.")

        # Step 2: Retrieve all assets list
        logger.info("Step 2: Retrieving asset registry list...")
        assets_resp = self.client.get("/api/v1/assets")
        self.assertEqual(assets_resp.status_code, 200)
        assets_body = assets_resp.json()
        self.assertTrue(assets_body["success"])
        self.assertEqual(len(assets_body["data"]), 8)
        
        tags = [a["tag_number"] for a in assets_body["data"]]
        self.assertIn("COB-1", tags)
        self.assertIn("GCM-104", tags)
        self.assertIn("PT-202", tags)

        # Step 3: Fetch details for critical gas main asset GCM-104
        logger.info("Step 3: Fetching details for gas main GCM-104...")
        details_resp = self.client.get("/api/v1/assets/GCM-104/details")
        self.assertEqual(details_resp.status_code, 200)
        details_body = details_resp.json()
        self.assertTrue(details_body["success"])
        
        data = details_body["data"]
        self.assertEqual(data["asset"]["tag_number"], "GCM-104")
        self.assertEqual(data["latest_risk"]["risk_score"], 88)
        self.assertEqual(data["latest_risk"]["risk_level"], "Critical")
        
        # Verify incidents list contains the pressure spike incident
        incidents = data["incidents"]
        self.assertEqual(len(incidents), 1)
        self.assertEqual(incidents[0]["title"], "Collector Main Pressure Spike")
        self.assertEqual(incidents[0]["severity"], "Critical")
        
        # Verify graph neighborhood exists
        self.assertIn("nodes", data["neighborhood"])
        self.assertIn("edges", data["neighborhood"])
        self.assertGreater(len(data["neighborhood"]["nodes"]), 0)

        # Step 4: Verify Executive Dashboard Aggregations
        logger.info("Step 4: Compiling plant-wide statistics...")
        dash_resp = self.client.get("/api/v1/dashboard/executive")
        self.assertEqual(dash_resp.status_code, 200)
        dash_body = dash_resp.json()
        self.assertTrue(dash_body["success"])
        
        dash_data = dash_body["data"]
        # Scores: GCM-104 (88), COB-1 (72), PSV-202 (45), HE-301 (20). Average = 225 / 4 = 56.25 (Rounded: 56)
        self.assertEqual(dash_data["avg_risk_score"], 56)
        self.assertEqual(dash_data["total_risk_assessed"], 4)
        
        # Verify risk level counts
        dist = dash_data["risk_distribution"]
        self.assertEqual(dist["Critical"], 1) # GCM-104
        self.assertEqual(dist["High"], 1) # COB-1
        self.assertEqual(dist["Medium"], 1) # PSV-202
        self.assertEqual(dist["Low"], 1) # HE-301

        # Verify compliance counts
        comp = dash_data["compliance_summary"]
        self.assertEqual(comp["total"], 3)
        self.assertEqual(comp["compliant"], 1)
        self.assertEqual(comp["non_compliant"], 1)
        self.assertEqual(comp["under_review"], 1)

        # Step 5: Test shortest path pathfinding recursive query
        logger.info("Step 5: Testing shortest path lookup between PIC-202 and PSV-202...")
        # Get nodes list to find IDs
        nodes_resp = self.client.get("/api/v1/graph/nodes")
        self.assertEqual(nodes_resp.status_code, 200)
        nodes_body = nodes_resp.json()
        self.assertTrue(nodes_body["success"])
        
        nodes = nodes_body["data"]
        pic_id = next(n["id"] for n in nodes if n["name"] == "PIC-202")
        psv_id = next(n["id"] for n in nodes if n["name"] == "PSV-202")
        
        path_resp = self.client.get(f"/api/v1/graph/shortest-path?source_id={pic_id}&target_id={psv_id}")
        self.assertEqual(path_resp.status_code, 200)
        path_body = path_resp.json()
        self.assertTrue(path_body["success"])
        
        # Paths should list PIC-202 --[CONTROLS]--> PSV-202
        path_data = path_body["data"]
        self.assertTrue(path_data["connected"])
        self.assertEqual(len(path_data["path_names"]), 2)
        self.assertEqual(path_data["path_names"][0], "PIC-202")
        self.assertEqual(path_data["path_names"][1], "PSV-202")
        logger.info("E2E verification tests successfully completed!")

if __name__ == "__main__":
    unittest.main()
