from typing import Dict, Any
from backend.services.rag import RAGService
from backend.services.graph import GraphService
from backend.repositories.graph import GraphRepository
from backend.models import OpsBrainException
from backend.config import logger

class AgentToolExecutor:
    def __init__(self):
        self.rag_service = RAGService()
        self.graph_service = GraphService()
        self.graph_repo = GraphRepository()

    def execute_tool(self, intent: str, parameters: Dict[str, Any], reply_message: str = None) -> Dict[str, Any]:
        logger.info(f"Executing agent tool for intent: {intent}")
        
        if intent == "GENERAL_CONVERSATION":
            return {
                "answer": reply_message or "Hello! I am your plant operations assistant. How can I help you today?",
                "sources": []
            }
            
        elif intent == "RAG_QUERY":
            query = parameters.get("query")
            if not query:
                raise OpsBrainException("RAG_QUERY requires a 'query' parameter", code="MISSING_PARAMETER", status_code=400)
            
            limit = parameters.get("limit", 3)
            threshold = parameters.get("threshold", 0.35)
            
            rag_result = self.rag_service.query_rag(
                query_text=query,
                limit=limit,
                threshold=threshold
            )
            return {
                "answer": rag_result["answer"],
                "sources": rag_result["sources"]
            }
            
        elif intent == "GRAPH_QUERY":
            action = parameters.get("action")
            if not action:
                raise OpsBrainException("GRAPH_QUERY requires an 'action' parameter ('shortest_path' or 'neighborhood')", code="MISSING_PARAMETER", status_code=400)
                
            if action == "shortest_path":
                source_tag = parameters.get("source_tag")
                target_tag = parameters.get("target_tag")
                if not source_tag or not target_tag:
                    raise OpsBrainException("Shortest path calculation requires both 'source_tag' and 'target_tag'", code="MISSING_PARAMETER", status_code=400)
                
                # Resolve tags to UUIDs
                source_node = self.graph_repo.get_node_by_name(source_tag)
                if not source_node:
                    raise OpsBrainException(f"Source tag '{source_tag}' not found in knowledge graph", code="TAG_NOT_FOUND", status_code=404)
                    
                target_node = self.graph_repo.get_node_by_name(target_tag)
                if not target_node:
                    raise OpsBrainException(f"Target tag '{target_tag}' not found in knowledge graph", code="TAG_NOT_FOUND", status_code=404)
                
                depth = parameters.get("depth", 5)
                path_result = self.graph_service.get_shortest_path(
                    source_id=source_node["id"],
                    target_id=target_node["id"],
                    max_depth=depth
                )
                
                if path_result["connected"]:
                    answer = f"The shortest path from {source_tag} to {target_tag} has {path_result['depth']} hop(s): " + " -> ".join(path_result["path_names"])
                else:
                    answer = f"No path found between {source_tag} and {target_tag} within {depth} hops."
                    
                return {
                    "answer": answer,
                    "details": path_result,
                    "sources": []
                }
                
            elif action == "neighborhood":
                start_tag = parameters.get("start_tag")
                if not start_tag:
                    raise OpsBrainException("Neighborhood traversal requires a 'start_tag'", code="MISSING_PARAMETER", status_code=400)
                    
                start_node = self.graph_repo.get_node_by_name(start_tag)
                if not start_node:
                    raise OpsBrainException(f"Start tag '{start_tag}' not found in knowledge graph", code="TAG_NOT_FOUND", status_code=404)
                    
                depth = parameters.get("depth", 2)
                neighbors = self.graph_service.get_neighborhood(
                    node_id=start_node["id"],
                    depth=depth
                )
                
                nodes_info = [f"{n['name']} ({n['type']})" for n in neighbors["nodes"]]
                answer = f"Found {len(neighbors['nodes'])} connected nodes around {start_tag} up to depth {depth}: " + ", ".join(nodes_info)
                
                return {
                    "answer": answer,
                    "details": neighbors,
                    "sources": []
                }
            else:
                raise OpsBrainException(f"Unknown graph action: {action}", code="UNKNOWN_ACTION", status_code=400)
        else:
            raise OpsBrainException(f"Unknown intent: {intent}", code="UNKNOWN_INTENT", status_code=400)
