import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.repositories.assets import AssetsRepository
from backend.repositories.compliance import ComplianceRepository
from backend.repositories.incidents import IncidentsRepository
from backend.config import logger
from datetime import datetime, timedelta

class TestDashboardEndpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.assets_repo = AssetsRepository()
        cls.compliance_repo = ComplianceRepository()
        cls.incidents_repo = IncidentsRepository()
        
        # Purge existing data
        logger.info("SetUpClass: Purging existing dashboard data...")
        with cls.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM compliance_records;")
            cur.execute("DELETE FROM asset_risk_scores;")
            cur.execute("DELETE FROM incidents;")
            cur.execute("DELETE FROM assets;")

    def tearDown(self):
        # Clean up
        with self.assets_repo.get_cursor() as cur:
            cur.execute("DELETE FROM compliance_records;")
            cur.execute("DELETE FROM asset_risk_scores;")
            cur.execute("DELETE FROM incidents;")
            cur.execute("DELETE FROM assets;")

    def test_executive_dashboard_aggregations(self):
        logger.info("Test: Setting up mock plant data for dashboard assertions...")
        
        # 1. Create mock assets
        asset_a = self.assets_repo.create_asset(
            tag_number="P-101A",
            name="Crude Pump A",
            category="Pump",
            description="Test pump A"
        )
        asset_b = self.assets_repo.create_asset(
            tag_number="P-101B",
            name="Crude Pump B",
            category="Pump",
            description="Test pump B"
        )
        asset_c = self.assets_repo.create_asset(
            tag_number="V-201",
            name="Storage Vessel",
            category="Vessel",
            description="Test vessel C"
        )

        asset_a_id = asset_a["id"]
        asset_b_id = asset_b["id"]
        asset_c_id = asset_c["id"]

        # 2. Insert risk scores (with sequential dates so we can test DISTINCT ON)
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        
        # Asset A has an older lower score, and a newer higher score
        with self.assets_repo.get_cursor() as cur:
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (asset_a_id, 40, "Medium", "Minor vibrations", yesterday)
            )
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (asset_a_id, 80, "High", "Critical vibrations and bearing wear", now)
            )
            # Asset B has a critical score
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (asset_b_id, 90, "Critical", "Temperature limit exceeded", now)
            )
            # Asset C has a low score
            cur.execute(
                "INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation, calculated_at) VALUES (%s, %s, %s, %s, %s);",
                (asset_c_id, 30, "Low", "Normal parameters", now)
            )

        # 3. Create compliance records
        # Asset A: Compliant
        with self.compliance_repo.get_cursor() as cur:
            cur.execute(
                "INSERT INTO compliance_records (asset_id, regulation_name, status, findings, last_checked) VALUES (%s, %s, %s, %s, %s);",
                (asset_a_id, "OISD-117", "COMPLIANT", "Meets all pump specs", now)
            )
            # Asset B: Non-compliant (Violation)
            cur.execute(
                "INSERT INTO compliance_records (asset_id, regulation_name, status, findings, last_checked) VALUES (%s, %s, %s, %s, %s);",
                (asset_b_id, "OSHA-1910", "NON_COMPLIANT", "Safety release valve calibration expired", now)
            )
            # Asset C: Under Review
            cur.execute(
                "INSERT INTO compliance_records (asset_id, regulation_name, status, findings, last_checked) VALUES (%s, %s, %s, %s, %s);",
                (asset_c_id, "EPA-Air", "UNDER_REVIEW", "Visual inspection pending review", now)
            )

        # 4. Create incidents
        # Asset A: High incident yesterday
        self.incidents_repo.create_incident(
            asset_id=asset_a_id,
            title="P-101A Seal vibration high",
            description="Bearing temperature spike",
            incident_date=yesterday,
            severity="High"
        )
        # Asset B: Critical incident today
        self.incidents_repo.create_incident(
            asset_id=asset_b_id,
            title="P-101B Overheat trip",
            description="Motor trip at 95C",
            incident_date=now,
            severity="Critical"
        )

        # 5. Query the executive dashboard endpoint
        response = self.client.get("/api/v1/dashboard/executive")
        self.assertEqual(response.status_code, 200)
        
        body = response.json()
        self.assertTrue(body["success"])
        
        data = body["data"]
        
        # Verify Risk Calculations
        # Latest scores: A=80, B=90, C=30. Average = (80+90+30)/3 = 67.
        self.assertEqual(data["avg_risk_score"], 67)
        self.assertEqual(data["total_risk_assessed"], 3)
        
        # Verify Risk Level Distribution
        dist = data["risk_distribution"]
        self.assertEqual(dist["Critical"], 1)
        self.assertEqual(dist["High"], 1)
        self.assertEqual(dist["Medium"], 0)
        self.assertEqual(dist["Low"], 1)

        # Verify Critical Assets List (Scores >= 75)
        # Should be Asset B (90) and Asset A (80) sorted descending
        crit_assets = data["critical_assets"]
        self.assertEqual(len(crit_assets), 2)
        self.assertEqual(crit_assets[0]["tag_number"], "P-101B")
        self.assertEqual(crit_assets[0]["risk_score"], 90)
        self.assertEqual(crit_assets[1]["tag_number"], "P-101A")
        self.assertEqual(crit_assets[1]["risk_score"], 80)

        # Verify Compliance Summary
        comp_sum = data["compliance_summary"]
        self.assertEqual(comp_sum["total"], 3)
        self.assertEqual(comp_sum["compliant"], 1)
        self.assertEqual(comp_sum["non_compliant"], 1)
        self.assertEqual(comp_sum["under_review"], 1)

        # Verify Compliance Violations List
        violations = data["compliance_violations"]
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["tag_number"], "P-101B")
        self.assertEqual(violations[0]["regulation_name"], "OSHA-1910")
        self.assertEqual(violations[0]["findings"], "Safety release valve calibration expired")

        # Verify Incident Trends (should have counts for yesterday and today)
        trends = data["incident_trends"]
        self.assertEqual(len(trends), 2)
        
        # Verify Alert Feed (Combined incidents, violations, risk level Critical/High)
        alerts = data["alert_feed"]
        self.assertGreater(len(alerts), 0)
        
        # Verify order is reverse chronological (newest first)
        alert_dates = [a["date"] for a in alerts]
        self.assertEqual(alert_dates, sorted(alert_dates, reverse=True))

if __name__ == "__main__":
    unittest.main()
