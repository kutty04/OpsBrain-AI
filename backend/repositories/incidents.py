from typing import List, Optional, Dict
from backend.repositories.base import BaseRepository
from datetime import datetime

class IncidentsRepository(BaseRepository):
    def create_incident(self, asset_id: str, title: str, description: str, incident_date: datetime, root_cause: Optional[str] = None, severity: str = "Low") -> Dict:
        query = """
            INSERT INTO incidents (asset_id, title, description, incident_date, root_cause, severity)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id, title, description, incident_date, root_cause, severity))
            return dict(cur.fetchone())

    def get_incidents_by_asset(self, asset_id: str) -> List[Dict]:
        query = "SELECT * FROM incidents WHERE asset_id = %s ORDER BY incident_date DESC;"
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id,))
            return [dict(row) for row in cur.fetchall()]

    def create_maintenance_log(self, asset_id: str, work_order_number: str, description: str, maintenance_date: datetime, performed_by: Optional[str] = None, cost: Optional[float] = None) -> Dict:
        query = """
            INSERT INTO maintenance_logs (asset_id, work_order_number, description, maintenance_date, performed_by, cost)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id, work_order_number, description, maintenance_date, performed_by, cost))
            return dict(cur.fetchone())

    def get_maintenance_logs_by_asset(self, asset_id: str) -> List[Dict]:
        query = "SELECT * FROM maintenance_logs WHERE asset_id = %s ORDER BY maintenance_date DESC;"
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id,))
            return [dict(row) for row in cur.fetchall()]
