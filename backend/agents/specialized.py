from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.agents.framework import BaseAgent
from backend.agents.registry import agent_tools
from backend.models import OpsBrainException
from backend.config import logger

# --- Response Schemas ---

class GraphTraceEdge(BaseModel):
    source: str = Field(..., description="Source equipment tag number.")
    target: str = Field(..., description="Target equipment tag number.")
    reason: Optional[str] = Field(default=None, description="Optional relationship path annotation.")

class GraphTrace(BaseModel):
    affected_nodes: List[str] = Field(default_factory=list, description="Equipment tag numbers involved in this diagnostic trace.")
    affected_edges: List[GraphTraceEdge] = Field(default_factory=list, description="Connections between nodes traversed during analysis.")
    reasoning_steps: List[str] = Field(default_factory=list, description="Agent's logical investigation reasoning stages.")
    evidence_refs: List[str] = Field(default_factory=list, description="Associated document names or regulations referenced.")

class KnowledgeResponse(BaseModel):
    answer: str = Field(..., description="Detailed text answer to the user's question.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0.")
    related_tags: List[str] = Field(default_factory=list, description="Related equipment tag numbers mentioned in the answer.")
    graph_trace: Optional[GraphTrace] = Field(default=None, description="Dynamic graph trace for RAG context visualization.")

class RCAResponse(BaseModel):
    identified_root_cause: str = Field(..., description="Clear explanation of the identified root cause.")
    contributing_factors: List[str] = Field(..., description="Key contributing factors to the failure.")
    suggested_mitigations: List[str] = Field(..., description="Recommended actions/mitigations to resolve the issue.")
    severity_assessment: str = Field(..., description="Assessment of incident severity (Low, Medium, High, Critical).")
    graph_trace: Optional[GraphTrace] = Field(default=None, description="Dynamic graph trace of failure propagation pathways.")

class ComplianceResponse(BaseModel):
    status: str = Field(..., description="Status must be one of: 'COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW'.")
    violations: List[str] = Field(..., description="Specific compliance/regulatory violations detected.")
    findings: str = Field(..., description="Summary details of the compliance assessment.")
    graph_trace: Optional[GraphTrace] = Field(default=None, description="Dynamic graph trace identifying audited/violating assets.")

class LessonsLearnedResponse(BaseModel):
    lessons_extracted: List[str] = Field(..., description="Key learnings extracted from historical incident data.")
    preventive_actions: List[str] = Field(..., description="Actions recommended to prevent a recurrence of these incidents.")
    safety_recommendations: List[str] = Field(..., description="General safety recommendations based on learnings.")
    graph_trace: Optional[GraphTrace] = Field(default=None, description="Dynamic graph trace mapping preventative actions to nodes.")

class RiskResponse(BaseModel):
    calculated_score: int = Field(..., ge=0, le=100, description="Risk score from 0 to 100.")
    risk_level: str = Field(..., description="Risk Level must be one of: 'Low', 'Medium', 'High', 'Critical'.")
    explanation: str = Field(..., description="Detailed breakdown explaining the risk calculation outcome.")
    graph_trace: Optional[GraphTrace] = Field(default=None, description="Dynamic graph trace illustrating cascading risk profiles.")

# --- System Prompts ---

KNOWLEDGE_PROMPT = (
    "You are the OpsBrain Knowledge Agent. Your role is to answer questions about the plant, assets, spec details, and safety documents.\n"
    "Using the provided asset details, neighborhood topology, and safety manual passages, write a detailed answer.\n"
    "Cite specific sources (SOPs, page numbers) and reference equipment tag numbers in your reply.\n"
    "You must also populate the 'graph_trace' property: list the affected nodes, the traversed edges (with a reason connecting them based on RAG context), your internal reasoning steps, and specific file references in 'evidence_refs'."
)

RCA_PROMPT = (
    "You are the OpsBrain Root Cause Analysis (RCA) Agent. Your role is to investigate equipment failure incidents.\n"
    "Correlate incident descriptions with active states, connected assets (neighborhood), and recent maintenance work orders.\n"
    "Determine if recent maintenance introduced a fault, if connected items caused a cascade, or if standard wear occurred.\n"
    "Draft a professional engineering Root Cause Analysis report matching the output format.\n"
    "You must also populate 'graph_trace': trace the failure progression through connected node tags (affected_nodes, affected_edges with failure propagation reason), explain your diagnostic steps (reasoning_steps), and document logs/SOPs in 'evidence_refs'."
)

COMPLIANCE_PROMPT = (
    "You are the OpsBrain Compliance Agent. Your role is to review asset operational history against regulatory safety guidelines.\n"
    "Look at active compliance records, safety limits, and recent incidents.\n"
    "Classify the status as 'COMPLIANT' (no active warnings or incidents), 'NON_COMPLIANT' (severe active violations/unresolved warnings), or 'UNDER_REVIEW'.\n"
    "Detail your findings and list specific regulations violated.\n"
    "You must also populate 'graph_trace': include the target asset tag and any connected measurement or regulation tags in 'affected_nodes', explain your audit path in 'reasoning_steps', and list active rules/guidelines in 'evidence_refs'."
)

LESSONS_LEARNED_PROMPT = (
    "You are the OpsBrain Lessons Learned Agent. Your role is to evaluate history logs to extract safety warnings and preventative checklists.\n"
    "Review historical incidents, maintenance notes, and manuals to formulate actionable safety warnings and design recommendations.\n"
    "You must also populate 'graph_trace': map preventive actions to equipment tags (affected_nodes), log your analysis flow (reasoning_steps), and reference historical WO/incident IDs in 'evidence_refs'."
)

RISK_PROMPT = (
    "You are the OpsBrain Risk Agent. Your role is to calculate an asset's risk score (0 to 100).\n"
    "Use these guidelines to calculate the score:\n"
    "- Baseline score: 10\n"
    "- Add 20 per active Incident (increase if Incident severity is High or Critical)\n"
    "- Add 25 if the latest Compliance status is NON_COMPLIANT\n"
    "- Add 15 if there are no recent Maintenance events within 90 days (suggesting maintenance backlog)\n"
    "- Add 10 if connected neighbors in graph have high risk scores (cascading risk)\n"
    "- Cap the final score at 100.\n"
    "Map the score to a Risk Level: 0-25 -> 'Low', 26-55 -> 'Medium', 56-85 -> 'High', 86-100 -> 'Critical'.\n"
    "Detail your explanation breakdown.\n"
    "You must also populate 'graph_trace': list the current tag and neighbors contributing to cascading risk (affected_nodes, affected_edges with scoring influence reason), outline your math (reasoning_steps), and list data documents in 'evidence_refs'."
)

# --- Agent Implementations ---

class KnowledgeAgent(BaseAgent):
    def __init__(self):
        super().__init__("Knowledge Agent", KNOWLEDGE_PROMPT, KnowledgeResponse)

    def execute(self, user_query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info("Executing Knowledge Agent...")
        tag_number = context_data.get("tag_number") if context_data else None
        
        # Pull tools context
        details = {}
        neighbors = {}
        rag_hits = {}
        
        if tag_number:
            try:
                details = agent_tools.call_tool("read_asset_details", tag_number=tag_number)
                neighbors = agent_tools.call_tool("read_asset_neighborhood", tag_number=tag_number, depth=2)
            except Exception as e:
                logger.warning(f"Knowledge Agent failed to fetch details for {tag_number}: {e}")
                
        try:
            rag_hits = agent_tools.call_tool("search_safety_manuals", query=user_query, limit=3)
        except Exception as e:
            logger.warning(f"Knowledge Agent RAG search failed: {e}")
            
        # Compile prompt
        prompt = (
            f"User Query: {user_query}\n\n"
            f"CONTEXT DATA:\n"
            f"- Equipment Details: {details}\n"
            f"- Graph Neighborhood: {neighbors}\n"
            f"- Safety Documents (RAG): {rag_hits}\n"
        )
        
        return self.execute_llm(prompt, tag_number=tag_number)

class RCAAgent(BaseAgent):
    def __init__(self):
        super().__init__("RCA Agent", RCA_PROMPT, RCAResponse)

    def execute(self, user_query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info("Executing RCA Agent...")
        tag_number = context_data.get("tag_number") if context_data else None
        if not tag_number:
            raise OpsBrainException("RCA Agent requires an asset 'tag_number' in the context", code="MISSING_TAG_NUMBER", status_code=400)
            
        details = agent_tools.call_tool("read_asset_details", tag_number=tag_number)
        neighbors = agent_tools.call_tool("read_asset_neighborhood", tag_number=tag_number, depth=2)
        
        prompt = (
            f"Task: Investigate failures for equipment {tag_number}.\n"
            f"User Query/Failure Context: {user_query}\n\n"
            f"HISTORICAL CONTEXT:\n"
            f"- Incidents & Maintenance: {details}\n"
            f"- Connected Topology: {neighbors}\n"
        )
        
        return self.execute_llm(prompt, tag_number=tag_number)

class ComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__("Compliance Agent", COMPLIANCE_PROMPT, ComplianceResponse)

    def execute(self, user_query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info("Executing Compliance Agent...")
        tag_number = context_data.get("tag_number") if context_data else None
        if not tag_number:
            raise OpsBrainException("Compliance Agent requires an asset 'tag_number' in the context", code="MISSING_TAG_NUMBER", status_code=400)
            
        details = agent_tools.call_tool("read_asset_details", tag_number=tag_number)
        
        prompt = (
            f"Task: Assess safety limit compliance for {tag_number}.\n"
            f"Context: {user_query}\n\n"
            f"COMPLIANCE TELEMETRY:\n"
            f"- Asset Details & Logs: {details}\n"
        )
        
        return self.execute_llm(prompt, tag_number=tag_number)

class LessonsLearnedAgent(BaseAgent):
    def __init__(self):
        super().__init__("Lessons Learned Agent", LESSONS_LEARNED_PROMPT, LessonsLearnedResponse)

    def execute(self, user_query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info("Executing Lessons Learned Agent...")
        tag_number = context_data.get("tag_number") if context_data else None
        
        details = {}
        if tag_number:
            details = agent_tools.call_tool("read_asset_details", tag_number=tag_number)
            
        prompt = (
            f"Task: Extract preventive safety checklists and warnings.\n"
            f"Scope/Query: {user_query}\n\n"
            f"HISTORY RECORDS:\n"
            f"- Asset failures & work logs: {details}\n"
        )
        
        return self.execute_llm(prompt, tag_number=tag_number)

class RiskAgent(BaseAgent):
    def __init__(self):
        super().__init__("Risk Agent", RISK_PROMPT, RiskResponse)

    def execute(self, user_query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        logger.info("Executing Risk Agent...")
        tag_number = context_data.get("tag_number") if context_data else None
        if not tag_number:
            raise OpsBrainException("Risk Agent requires an asset 'tag_number' in the context", code="MISSING_TAG_NUMBER", status_code=400)
            
        # Fetch details and neighbor risk levels
        details = agent_tools.call_tool("read_asset_details", tag_number=tag_number)
        neighbors = agent_tools.call_tool("read_asset_neighborhood", tag_number=tag_number, depth=1)
        
        # Compile details of neighbor risk profiles
        neighbor_risks = []
        for node in neighbors.get("nodes", []):
            if node["name"] != tag_number and node.get("asset_id"):
                try:
                    node_details = agent_tools.call_tool("read_asset_details", tag_number=node["name"])
                    if node_details.get("latest_risk"):
                        neighbor_risks.append({
                            "tag": node["name"],
                            "risk_score": node_details["latest_risk"]["risk_score"],
                            "risk_level": node_details["latest_risk"]["risk_level"]
                        })
                except Exception:
                    pass
                    
        prompt = (
            f"Task: Calculate risk profile for equipment {tag_number}.\n"
            f"User input parameters: {user_query}\n\n"
            f"TELEMETRY DETAILS:\n"
            f"- Historical Incidents, Compliance & Maintenance: {details}\n"
            f"- Neighbor Asset Risks: {neighbor_risks}\n"
        )
        
        # 1. Run evaluation
        evaluation = self.execute_llm(prompt, tag_number=tag_number)
        
        # 2. Write risk score back to database using tool
        try:
            agent_tools.call_tool(
                "write_asset_risk_score",
                tag_number=tag_number,
                risk_score=evaluation["calculated_score"],
                risk_level=evaluation["risk_level"],
                explanation=evaluation["explanation"]
            )
            logger.info(f"Successfully committed calculated risk score for {tag_number} ({evaluation['calculated_score']})")
        except Exception as e:
            logger.error(f"Failed to commit risk score to database: {e}")
            
        return evaluation
