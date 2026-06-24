from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.agents.framework import ToolRegistry
from backend.services.rag import RAGService
from backend.services.graph import GraphService
from backend.repositories.assets import AssetsRepository
from backend.repositories.incidents import IncidentsRepository
from backend.repositories.compliance import ComplianceRepository
from backend.repositories.graph import GraphRepository
from backend.models import OpsBrainException
from backend.config import logger

# Initialize registries
agent_tools = ToolRegistry()

# Initialize repositories and services
assets_repo = AssetsRepository()
incidents_repo = IncidentsRepository()
compliance_repo = ComplianceRepository()
graph_repo = GraphRepository()

rag_service = RAGService()
graph_service = GraphService()

# --- Tool Implementations ---

def read_asset_details(tag_number: str) -> Dict[str, Any]:
    logger.info(f"Tool read_asset_details: tag={tag_number}")
    asset = assets_repo.get_asset_by_tag(tag_number)
    if not asset:
        raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
        
    asset_id = asset["id"]
    latest_risk = assets_repo.get_latest_risk_score(asset_id)
    incidents = incidents_repo.get_incidents_by_asset(asset_id)
    maintenance = incidents_repo.get_maintenance_logs_by_asset(asset_id)
    compliance = compliance_repo.get_compliance_records_by_asset(asset_id)
    
    # helper serialization
    def serialize_dates(item):
        serialized = dict(item)
        for key, value in serialized.items():
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
        return serialized

    return {
        "asset": asset,
        "latest_risk": serialize_dates(latest_risk) if latest_risk else None,
        "incidents": [serialize_dates(i) for i in incidents],
        "maintenance_logs": [serialize_dates(m) for m in maintenance],
        "compliance_records": [serialize_dates(c) for c in compliance]
    }

def read_asset_neighborhood(tag_number: str, depth: int = 2) -> Dict[str, Any]:
    logger.info(f"Tool read_asset_neighborhood: tag={tag_number}, depth={depth}")
    node = graph_repo.get_node_by_name(tag_number)
    if not node:
        raise OpsBrainException(f"Graph node for tag '{tag_number}' not found", code="NODE_NOT_FOUND", status_code=404)
        
    return graph_service.get_neighborhood(node_id=node["id"], depth=depth)

def search_safety_manuals(query: str, limit: int = 3) -> Dict[str, Any]:
    logger.info(f"Tool search_safety_manuals: query='{query[:50]}'")
    return rag_service.query_rag(query_text=query, limit=limit)

def write_asset_risk_score(tag_number: str, risk_score: int, risk_level: str, explanation: str) -> Dict[str, Any]:
    logger.info(f"Tool write_asset_risk_score: tag={tag_number}, score={risk_score}, level={risk_level}")
    asset = assets_repo.get_asset_by_tag(tag_number)
    if not asset:
        raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
        
    result = assets_repo.create_or_update_risk_score(
        asset_id=asset["id"],
        risk_score=risk_score,
        risk_level=risk_level,
        explanation=explanation
    )
    # Serialize datetime
    if "calculated_at" in result and isinstance(result["calculated_at"], datetime):
        result["calculated_at"] = result["calculated_at"].isoformat()
    return result

def create_compliance_record(tag_number: str, regulation_name: str, status: str, findings: str) -> Dict[str, Any]:
    logger.info(f"Tool create_compliance_record: tag={tag_number}, reg={regulation_name}, status={status}")
    asset = assets_repo.get_asset_by_tag(tag_number)
    if not asset:
        raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
        
    result = compliance_repo.create_compliance_record(
        asset_id=asset["id"],
        regulation_name=regulation_name,
        status=status,
        findings=findings
    )
    if "last_checked" in result and isinstance(result["last_checked"], datetime):
        result["last_checked"] = result["last_checked"].isoformat()
    return result

def create_incident_report(tag_number: str, title: str, description: str, severity: str, root_cause: str) -> Dict[str, Any]:
    logger.info(f"Tool create_incident_report: tag={tag_number}, title='{title}'")
    asset = assets_repo.get_asset_by_tag(tag_number)
    if not asset:
        raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
        
    result = incidents_repo.create_incident(
        asset_id=asset["id"],
        title=title,
        description=description,
        incident_date=datetime.utcnow(),
        root_cause=root_cause,
        severity=severity
    )
    if "incident_date" in result and isinstance(result["incident_date"], datetime):
        result["incident_date"] = result["incident_date"].isoformat()
    if "created_at" in result and isinstance(result["created_at"], datetime):
        result["created_at"] = result["created_at"].isoformat()
    return result

def create_maintenance_log(tag_number: str, work_order_number: str, description: str, performed_by: str, cost: float) -> Dict[str, Any]:
    logger.info(f"Tool create_maintenance_log: tag={tag_number}, wo={work_order_number}")
    asset = assets_repo.get_asset_by_tag(tag_number)
    if not asset:
        raise OpsBrainException(f"Asset tag '{tag_number}' not found", code="ASSET_NOT_FOUND", status_code=404)
        
    result = incidents_repo.create_maintenance_log(
        asset_id=asset["id"],
        work_order_number=work_order_number,
        description=description,
        maintenance_date=datetime.utcnow(),
        performed_by=performed_by,
        cost=cost
    )
    if "maintenance_date" in result and isinstance(result["maintenance_date"], datetime):
        result["maintenance_date"] = result["maintenance_date"].isoformat()
    return result

# --- Register Tools ---
agent_tools.register_tool("read_asset_details", read_asset_details)
agent_tools.register_tool("read_asset_neighborhood", read_asset_neighborhood)
agent_tools.register_tool("search_safety_manuals", search_safety_manuals)
agent_tools.register_tool("write_asset_risk_score", write_asset_risk_score)
agent_tools.register_tool("create_compliance_record", create_compliance_record)
agent_tools.register_tool("create_incident_report", create_incident_report)
agent_tools.register_tool("create_maintenance_log", create_maintenance_log)
