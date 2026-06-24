from typing import List, Optional, Dict, Any
from backend.repositories.base import BaseRepository
import json

class GraphRepository(BaseRepository):
    # Existing methods for backward compatibility
    def create_node(self, name: str, type: str, asset_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict:
        metadata_json = json.dumps(metadata) if metadata else None
        with self.get_cursor() as cur:
            cur.execute("SELECT * FROM knowledge_nodes WHERE name = %s AND type = %s;", (name, type))
            row = cur.fetchone()
            if row:
                update_query = """
                    UPDATE knowledge_nodes 
                    SET asset_id = COALESCE(%s, asset_id), 
                        metadata = COALESCE(%s, metadata)
                    WHERE id = %s
                    RETURNING *;
                """
                cur.execute(update_query, (asset_id, metadata_json, row['id']))
                return dict(cur.fetchone())
            else:
                insert_query = """
                    INSERT INTO knowledge_nodes (name, type, asset_id, metadata)
                    VALUES (%s, %s, %s, %s)
                    RETURNING *;
                """
                cur.execute(insert_query, (name, type, asset_id, metadata_json))
                return dict(cur.fetchone())

    def create_edge(self, source_id: str, target_id: str, relation_type: str, weight: float = 1.0, metadata: Optional[Dict[str, Any]] = None) -> Dict:
        metadata_json = json.dumps(metadata) if metadata else None
        query = """
            INSERT INTO knowledge_edges (source_id, target_id, relation_type, weight, metadata)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (source_id, target_id, relation_type) DO UPDATE 
            SET weight = EXCLUDED.weight, metadata = EXCLUDED.metadata
            RETURNING *;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (source_id, target_id, relation_type, weight, metadata_json))
            return dict(cur.fetchone())

    def get_graph_neighborhood(self, asset_id: str, depth: int = 2) -> Dict[str, List]:
        query_nodes = """
            WITH RECURSIVE graph_path AS (
                SELECT id, name, type, asset_id, metadata, 0 as depth 
                FROM knowledge_nodes 
                WHERE asset_id = %s
                
                UNION
                
                SELECT n.id, n.name, n.type, n.asset_id, n.metadata, gp.depth + 1
                FROM knowledge_nodes n
                JOIN knowledge_edges e ON (e.target_id = n.id OR e.source_id = n.id)
                JOIN graph_path gp ON (e.source_id = gp.id OR e.target_id = gp.id)
                WHERE gp.depth < %s
            )
            SELECT DISTINCT id, name, type, asset_id, metadata FROM graph_path;
        """
        with self.get_cursor() as cur:
            cur.execute(query_nodes, (asset_id, depth))
            nodes = [dict(row) for row in cur.fetchall()]
            if not nodes:
                return {"nodes": [], "edges": []}
            node_ids = [n['id'] for n in nodes]
            query_edges = """
                SELECT * FROM knowledge_edges 
                WHERE source_id = ANY(%s::uuid[]) AND target_id = ANY(%s::uuid[]);
            """
            cur.execute(query_edges, (node_ids, node_ids))
            edges = [dict(row) for row in cur.fetchall()]
            return {"nodes": nodes, "edges": edges}

    # Extended CRUD and list operations
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM knowledge_nodes WHERE id = %s;"
        with self.get_cursor() as cur:
            cur.execute(query, (node_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_node_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM knowledge_nodes WHERE name = %s;"
        with self.get_cursor() as cur:
            cur.execute(query, (name,))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete_node(self, node_id: str) -> bool:
        query = "DELETE FROM knowledge_nodes WHERE id = %s RETURNING id;"
        with self.get_cursor() as cur:
            cur.execute(query, (node_id,))
            row = cur.fetchone()
            return row is not None

    def list_nodes(self, type: Optional[str] = None, name_search: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if type:
            conditions.append("type = %s")
            params.append(type)
        if name_search:
            conditions.append("name ILIKE %s")
            params.append(f"%{name_search}%")
            
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        query = f"SELECT * FROM knowledge_nodes{where_clause} ORDER BY name LIMIT %s OFFSET %s;"
        params.extend([limit, offset])
        
        with self.get_cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def get_edge(self, edge_id: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM knowledge_edges WHERE id = %s;"
        with self.get_cursor() as cur:
            cur.execute(query, (edge_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def delete_edge(self, edge_id: str) -> bool:
        query = "DELETE FROM knowledge_edges WHERE id = %s RETURNING id;"
        with self.get_cursor() as cur:
            cur.execute(query, (edge_id,))
            row = cur.fetchone()
            return row is not None

    def list_edges(self, relation_type: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if relation_type:
            conditions.append("relation_type = %s")
            params.append(relation_type)
            
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        query = f"SELECT * FROM knowledge_edges{where_clause} ORDER BY relation_type, source_id LIMIT %s OFFSET %s;"
        params.extend([limit, offset])
        
        with self.get_cursor() as cur:
            cur.execute(query, tuple(params))
            return [dict(row) for row in cur.fetchall()]

    def get_neighborhood_by_node_id(self, node_id: str, depth: int = 2) -> Dict[str, List]:
        query_nodes = """
            WITH RECURSIVE graph_path AS (
                SELECT id, name, type, asset_id, metadata, 0 as depth 
                FROM knowledge_nodes 
                WHERE id = %s
                
                UNION
                
                SELECT n.id, n.name, n.type, n.asset_id, n.metadata, gp.depth + 1
                FROM knowledge_nodes n
                JOIN knowledge_edges e ON (e.target_id = n.id OR e.source_id = n.id)
                JOIN graph_path gp ON (e.source_id = gp.id OR e.target_id = gp.id)
                WHERE gp.depth < %s
            )
            SELECT DISTINCT id, name, type, asset_id, metadata FROM graph_path;
        """
        with self.get_cursor() as cur:
            cur.execute(query_nodes, (node_id, depth))
            nodes = [dict(row) for row in cur.fetchall()]
            if not nodes:
                return {"nodes": [], "edges": []}
            node_ids = [n['id'] for n in nodes]
            query_edges = """
                SELECT * FROM knowledge_edges 
                WHERE source_id = ANY(%s::uuid[]) AND target_id = ANY(%s::uuid[]);
            """
            cur.execute(query_edges, (node_ids, node_ids))
            edges = [dict(row) for row in cur.fetchall()]
            return {"nodes": nodes, "edges": edges}

    def get_shortest_path(self, source_id: str, target_id: str, max_depth: int = 5) -> Optional[Dict[str, Any]]:
        query = """
            WITH RECURSIVE search_graph(source_id, target_id, path, depth, cycle) AS (
                SELECT 
                    e.source_id, 
                    e.target_id, 
                    ARRAY[e.source_id::text, e.target_id::text] AS path, 
                    1 AS depth,
                    FALSE AS cycle
                FROM knowledge_edges e
                WHERE e.source_id = %s::uuid
                
                UNION ALL
                
                SELECT 
                    sg.source_id, 
                    e.target_id, 
                    sg.path || e.target_id::text AS path, 
                    sg.depth + 1 AS depth,
                    e.target_id::text = ANY(sg.path) AS cycle
                FROM knowledge_edges e
                JOIN search_graph sg ON sg.target_id = e.source_id
                WHERE NOT sg.cycle AND sg.depth < %s
            )
            SELECT path, depth
            FROM search_graph
            WHERE target_id = %s::uuid
            ORDER BY depth ASC
            LIMIT 1;
        """
        with self.get_cursor() as cur:
            cur.execute(query, (source_id, max_depth, target_id))
            row = cur.fetchone()
            return dict(row) if row else None
