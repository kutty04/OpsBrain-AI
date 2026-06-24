from typing import Generic, TypeVar, Optional, Any, List, Dict
from pydantic import BaseModel
from datetime import datetime

T = TypeVar("T")

# API Response Standards
class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None

class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: Optional[str] = None

# Custom Exception
class OpsBrainException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_SERVER_ERROR", status_code: int = 500, detail: Optional[str] = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)

# --- Database Models ---

# Assets (Digital Twins)
class AssetBase(BaseModel):
    tag_number: str
    name: str
    category: str
    description: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: str
    created_at: datetime

# Persistent Risk Scores
class AssetRiskScoreBase(BaseModel):
    asset_id: str
    risk_score: int
    risk_level: str
    explanation: Optional[str] = None

class AssetRiskScoreCreate(AssetRiskScoreBase):
    pass

class AssetRiskScore(AssetRiskScoreBase):
    id: str
    calculated_at: datetime

# Documents Registry
class DocumentBase(BaseModel):
    title: str
    file_type: str # SOP, MANUAL, REGULATION, INCIDENT
    file_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    created_at: datetime

# Document Chunks
class DocumentChunkBase(BaseModel):
    document_id: str
    content: str
    page_number: Optional[int] = None

class DocumentChunkCreate(DocumentChunkBase):
    embedding: List[float]

class DocumentChunk(DocumentChunkBase):
    id: str
    created_at: datetime

# Incidents
class IncidentBase(BaseModel):
    asset_id: str
    title: str
    description: str
    root_cause: Optional[str] = None
    severity: str = "Low"
    incident_date: datetime

class IncidentCreate(IncidentBase):
    pass

class Incident(IncidentBase):
    id: str
    created_at: datetime

# Maintenance Logs
class MaintenanceLogBase(BaseModel):
    asset_id: str
    work_order_number: str
    description: str
    performed_by: Optional[str] = None
    maintenance_date: datetime
    cost: Optional[float] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLog(MaintenanceLogBase):
    id: str

# Compliance Records
class ComplianceRecordBase(BaseModel):
    asset_id: str
    regulation_name: str
    status: str # COMPLIANT, NON_COMPLIANT, UNDER_REVIEW
    findings: Optional[str] = None

class ComplianceRecordCreate(ComplianceRecordBase):
    pass

class ComplianceRecord(ComplianceRecordBase):
    id: str
    last_checked: datetime

# Knowledge Graph Nodes
class KnowledgeNodeBase(BaseModel):
    name: str
    type: str # Asset, Regulation, Document, Incident
    asset_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeNodeCreate(KnowledgeNodeBase):
    pass

class KnowledgeNode(KnowledgeNodeBase):
    id: str

# Knowledge Graph Edges
class KnowledgeEdgeBase(BaseModel):
    source_id: str
    target_id: str
    relation_type: str # LOCATED_IN, GOVERNS, HAS_INCIDENT, CONNECTED_TO
    weight: float = 1.0
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeEdgeCreate(KnowledgeEdgeBase):
    pass

class KnowledgeEdge(KnowledgeEdgeBase):
    id: str
