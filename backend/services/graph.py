from typing import List, Optional, Dict, Any
from backend.repositories.graph import GraphRepository
from backend.models import OpsBrainException, KnowledgeNodeCreate, KnowledgeEdgeCreate
from backend.config import logger

class GraphService:
    def __init__(self):
        self.repo = GraphRepository()

    # --- Node Operations ---
    def create_node(self, node: KnowledgeNodeCreate) -> Dict[str, Any]:
        logger.info(f"Creating/updating node: {node.name} ({node.type})")
        try:
            return self.repo.create_node(
                name=node.name,
                type=node.type,
                asset_id=node.asset_id,
                metadata=node.metadata
            )
        except Exception as e:
            logger.error(f"Error creating node: {e}")
            raise OpsBrainException(f"Failed to create node: {e}", code="NODE_CREATION_FAILED")

    def get_node(self, node_id: str) -> Dict[str, Any]:
        logger.debug(f"Fetching node by id: {node_id}")
        node = self.repo.get_node(node_id)
        if not node:
            raise OpsBrainException(f"Node with ID {node_id} not found", code="NODE_NOT_FOUND", status_code=404)
        return node

    def delete_node(self, node_id: str) -> bool:
        logger.info(f"Deleting node: {node_id}")
        # Verify node existence first
        self.get_node(node_id)
        try:
            return self.repo.delete_node(node_id)
        except Exception as e:
            logger.error(f"Error deleting node: {e}")
            raise OpsBrainException(f"Failed to delete node: {e}", code="NODE_DELETION_FAILED")

    def list_nodes(self, type: Optional[str] = None, name_search: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        logger.debug(f"Listing nodes (type={type}, search={name_search}, limit={limit}, offset={offset})")
        return self.repo.list_nodes(type=type, name_search=name_search, limit=limit, offset=offset)

    # --- Edge Operations ---
    def create_edge(self, edge: KnowledgeEdgeCreate) -> Dict[str, Any]:
        logger.info(f"Creating/updating edge: {edge.source_id} --[{edge.relation_type}]--> {edge.target_id}")
        
        # Validation: Self-loop prevention
        if edge.source_id == edge.target_id:
            raise OpsBrainException("Self-loop connections are not allowed in the knowledge graph", code="SELF_LOOP_FORBIDDEN", status_code=400)
            
        # Validation: Source and Target existence
        source_node = self.repo.get_node(edge.source_id)
        if not source_node:
            raise OpsBrainException(f"Source node with ID {edge.source_id} not found", code="SOURCE_NODE_NOT_FOUND", status_code=404)
            
        target_node = self.repo.get_node(edge.target_id)
        if not target_node:
            raise OpsBrainException(f"Target node with ID {edge.target_id} not found", code="TARGET_NODE_NOT_FOUND", status_code=404)
            
        try:
            return self.repo.create_edge(
                source_id=edge.source_id,
                target_id=edge.target_id,
                relation_type=edge.relation_type,
                weight=edge.weight,
                metadata=edge.metadata
            )
        except Exception as e:
            logger.error(f"Error creating edge: {e}")
            raise OpsBrainException(f"Failed to create edge: {e}", code="EDGE_CREATION_FAILED")

    def get_edge(self, edge_id: str) -> Dict[str, Any]:
        logger.debug(f"Fetching edge by id: {edge_id}")
        edge = self.repo.get_edge(edge_id)
        if not edge:
            raise OpsBrainException(f"Edge with ID {edge_id} not found", code="EDGE_NOT_FOUND", status_code=404)
        return edge

    def delete_edge(self, edge_id: str) -> bool:
        logger.info(f"Deleting edge: {edge_id}")
        self.get_edge(edge_id)
        try:
            return self.repo.delete_edge(edge_id)
        except Exception as e:
            logger.error(f"Error deleting edge: {e}")
            raise OpsBrainException(f"Failed to delete edge: {e}", code="EDGE_DELETION_FAILED")

    def list_edges(self, relation_type: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        logger.debug(f"Listing edges (relation_type={relation_type}, limit={limit}, offset={offset})")
        return self.repo.list_edges(relation_type=relation_type, limit=limit, offset=offset)

    # --- Graph Traversal & Neighbor Discovery ---
    def get_neighborhood(self, node_id: Optional[str] = None, asset_id: Optional[str] = None, depth: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        if not node_id and not asset_id:
            raise OpsBrainException("Either node_id or asset_id must be provided to fetch graph neighborhood", code="MISSING_START_NODE", status_code=400)
            
        if depth < 1 or depth > 5:
            raise OpsBrainException("Graph traversal depth must be between 1 and 5", code="INVALID_DEPTH", status_code=400)
            
        try:
            if node_id:
                # Validate node exists
                self.get_node(node_id)
                logger.info(f"Fetching neighborhood starting from node {node_id} up to depth {depth}")
                return self.repo.get_neighborhood_by_node_id(node_id, depth)
            else:
                logger.info(f"Fetching neighborhood starting from asset {asset_id} up to depth {depth}")
                return self.repo.get_graph_neighborhood(asset_id, depth)
        except OpsBrainException as oe:
            raise oe
        except Exception as e:
            logger.error(f"Error traversing graph neighborhood: {e}")
            raise OpsBrainException(f"Graph traversal failed: {e}", code="TRAVERSAL_FAILED")

    def get_shortest_path(self, source_id: str, target_id: str, max_depth: int = 5) -> Dict[str, Any]:
        logger.info(f"Finding shortest path between {source_id} and {target_id} (max_depth={max_depth})")
        
        # Verify source and target exist
        self.get_node(source_id)
        self.get_node(target_id)
        
        if max_depth < 1 or max_depth > 10:
            raise OpsBrainException("Shortest path max depth must be between 1 and 10", code="INVALID_MAX_DEPTH", status_code=400)
            
        try:
            path_result = self.repo.get_shortest_path(source_id, target_id, max_depth)
            if not path_result:
                return {
                    "path_ids": [],
                    "path_names": [],
                    "depth": 0,
                    "connected": False
                }
                
            path_ids = path_result["path"]
            path_names = []
            for nid in path_ids:
                node = self.repo.get_node(nid)
                path_names.append(node["name"] if node else nid)
                
            return {
                "path_ids": path_ids,
                "path_names": path_names,
                "depth": path_result["depth"],
                "connected": True
            }
        except Exception as e:
            logger.error(f"Error calculating shortest path: {e}")
            raise OpsBrainException(f"Shortest path calculation failed: {e}", code="SHORTEST_PATH_FAILED")
