from fastapi import APIRouter, status, Query
from typing import Optional, List, Dict, Any
from backend.models import APIResponse, KnowledgeNodeCreate, KnowledgeEdgeCreate
from backend.services.graph import GraphService
from backend.repositories.assets import AssetsRepository
from backend.models import OpsBrainException
from backend.config import logger

router = APIRouter(tags=["Knowledge Graph"])
graph_service = GraphService()
assets_repository = AssetsRepository()

from backend.repositories.incidents import IncidentsRepository
from backend.repositories.compliance import ComplianceRepository

incidents_repository = IncidentsRepository()
compliance_repository = ComplianceRepository()

@router.get("/assets", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def list_all_assets_endpoint():
    logger.info("Listing all assets")
    try:
        assets = assets_repository.get_all_assets()
        # Serialize datetime
        import datetime as dt
        serialized = []
        for a in assets:
            item = dict(a)
            if "created_at" in item and isinstance(item["created_at"], dt.datetime):
                item["created_at"] = item["created_at"].isoformat()
            serialized.append(item)
        return APIResponse(
            success=True,
            message="Assets list retrieved successfully",
            data=serialized
        )
    except Exception as e:
        logger.error(f"Failed to list assets: {e}")
        raise OpsBrainException(f"Failed to list assets: {e}", code="ASSETS_LIST_FAILED")

@router.get("/assets/{tag_number}/details", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_asset_details_endpoint(tag_number: str):
    logger.info(f"Fetching details for asset tag: {tag_number}")
    try:
        asset = assets_repository.get_asset_by_tag(tag_number)
        if not asset:
            raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
            
        asset_id = asset["id"]
        latest_risk = assets_repository.get_latest_risk_score(asset_id)
        incidents = incidents_repository.get_incidents_by_asset(asset_id)
        maintenance = incidents_repository.get_maintenance_logs_by_asset(asset_id)
        compliance = compliance_repository.get_compliance_records_by_asset(asset_id)
        neighborhood = graph_service.get_neighborhood(asset_id=asset_id, depth=2)
        
        # helper serialization
        import datetime as dt
        def serialize_dates(item):
            serialized = dict(item)
            for key, value in serialized.items():
                if isinstance(value, dt.datetime):
                    serialized[key] = value.isoformat()
            return serialized

        data = {
            "asset": serialize_dates(asset),
            "latest_risk": serialize_dates(latest_risk) if latest_risk else None,
            "incidents": [serialize_dates(i) for i in incidents],
            "maintenance_logs": [serialize_dates(m) for m in maintenance],
            "compliance_records": [serialize_dates(c) for c in compliance],
            "neighborhood": neighborhood
        }
        
        return APIResponse(
            success=True,
            message="Asset details retrieved successfully",
            data=data
        )
    except OpsBrainException as oe:
        raise oe
    except Exception as e:
        logger.error(f"Failed to get asset details: {e}")
        raise OpsBrainException(f"Failed to retrieve asset details: {e}", code="ASSET_DETAILS_FAILED")

# --- Node Routes ---

@router.get("/graph/nodes", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def list_nodes_endpoint(
    type: Optional[str] = Query(None, description="Filter nodes by type"),
    name_search: Optional[str] = Query(None, description="Search node name using case-insensitive partial match"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    nodes = graph_service.list_nodes(type=type, name_search=name_search, limit=limit, offset=offset)
    return APIResponse(
        success=True,
        message="Nodes list retrieved successfully",
        data=nodes
    )

@router.post("/graph/nodes", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def create_node_endpoint(node: KnowledgeNodeCreate):
    created_node = graph_service.create_node(node)
    return APIResponse(
        success=True,
        message="Node created/updated successfully",
        data=created_node
    )

@router.get("/graph/nodes/{node_id}", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_node_endpoint(node_id: str):
    node = graph_service.get_node(node_id)
    return APIResponse(
        success=True,
        message="Node details retrieved successfully",
        data=node
    )

@router.delete("/graph/nodes/{node_id}", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def delete_node_endpoint(node_id: str):
    deleted = graph_service.delete_node(node_id)
    return APIResponse(
        success=True,
        message="Node deleted successfully",
        data={"deleted": deleted}
    )

# --- Edge Routes ---

@router.get("/graph/edges", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def list_edges_endpoint(
    relation_type: Optional[str] = Query(None, description="Filter edges by relation type"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    edges = graph_service.list_edges(relation_type=relation_type, limit=limit, offset=offset)
    return APIResponse(
        success=True,
        message="Edges list retrieved successfully",
        data=edges
    )

@router.post("/graph/edges", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def create_edge_endpoint(edge: KnowledgeEdgeCreate):
    created_edge = graph_service.create_edge(edge)
    return APIResponse(
        success=True,
        message="Edge created/updated successfully",
        data=created_edge
    )

@router.get("/graph/edges/{edge_id}", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_edge_endpoint(edge_id: str):
    edge = graph_service.get_edge(edge_id)
    return APIResponse(
        success=True,
        message="Edge details retrieved successfully",
        data=edge
    )

@router.delete("/graph/edges/{edge_id}", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def delete_edge_endpoint(edge_id: str):
    deleted = graph_service.delete_edge(edge_id)
    return APIResponse(
        success=True,
        message="Edge deleted successfully",
        data={"deleted": deleted}
    )

# --- Graph Traversal & Neighbor Discovery ---

@router.get("/graph/neighborhood", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_neighborhood_endpoint(
    node_id: Optional[str] = Query(None, description="Starting node ID for neighborhood traversal"),
    asset_id: Optional[str] = Query(None, description="Starting asset ID for neighborhood traversal"),
    depth: int = Query(2, ge=1, le=5, description="Search depth (hops)")
):
    neighborhood = graph_service.get_neighborhood(node_id=node_id, asset_id=asset_id, depth=depth)
    return APIResponse(
        success=True,
        message="Graph neighborhood retrieved successfully",
        data=neighborhood
    )

@router.get("/graph/shortest-path", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def get_shortest_path_endpoint(
    source_id: str = Query(..., description="Source node ID"),
    target_id: str = Query(..., description="Target node ID"),
    max_depth: int = Query(5, ge=1, le=10, description="Maximum path search depth (hops)")
):
    path = graph_service.get_shortest_path(source_id=source_id, target_id=target_id, max_depth=max_depth)
    return APIResponse(
        success=True,
        message="Shortest path calculated successfully",
        data=path
    )
