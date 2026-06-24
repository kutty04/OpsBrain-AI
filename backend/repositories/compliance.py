from typing import List, Optional, Dict
from backend.repositories.base import BaseRepository

class ComplianceRepository(BaseRepository):
    def create_compliance_record(self, asset_id: str, regulation_name: str, status: str, findings: Optional[str] = None) -> Dict:
        query = """
            INSERT INTO compliance_records (asset_id, regulation_name, status, findings)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id, regulation_name, status, findings))
            return dict(cur.fetchone())

    def get_compliance_records_by_asset(self, asset_id: str) -> List[Dict]:
        query = "SELECT * FROM compliance_records WHERE asset_id = %s ORDER BY last_checked DESC;"
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id,))
            return [dict(row) for row in cur.fetchall()]
