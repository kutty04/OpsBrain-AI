from typing import List, Optional, Dict
from backend.repositories.base import BaseRepository

class AssetsRepository(BaseRepository):
    def create_asset(self, tag_number: str, name: str, category: str, description: Optional[str] = None) -> Dict:
        query = """
            INSERT INTO assets (tag_number, name, category, description)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (tag_number) DO UPDATE 
            SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (tag_number, name, category, description))
            return dict(cur.fetchone())

    def get_asset_by_tag(self, tag_number: str) -> Optional[Dict]:
        query = "SELECT * FROM assets WHERE tag_number = %s;"
        with self.get_cursor() as cur:
            cur.execute(query, (tag_number,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_all_assets(self) -> List[Dict]:
        query = "SELECT * FROM assets ORDER BY tag_number ASC;"
        with self.get_cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def create_or_update_risk_score(self, asset_id: str, risk_score: int, risk_level: str, explanation: str) -> Dict:
        query = """
            INSERT INTO asset_risk_scores (asset_id, risk_score, risk_level, explanation)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id, risk_score, risk_level, explanation))
            return dict(cur.fetchone())

    def get_latest_risk_score(self, asset_id: str) -> Optional[Dict]:
        query = """
            SELECT * FROM asset_risk_scores 
            WHERE asset_id = %s 
            ORDER BY calculated_at DESC 
            LIMIT 1;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (asset_id,))
            row = cur.fetchone()
            return dict(row) if row else None
