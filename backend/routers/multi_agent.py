from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional
from backend.models import APIResponse
from backend.agents.specialized import (
    KnowledgeAgent,
    RCAAgent,
    ComplianceAgent,
    LessonsLearnedAgent,
    RiskAgent
)

router = APIRouter(tags=["Multi-Agent System"])

# Initialize specialized agents
knowledge_agent = KnowledgeAgent()
rca_agent = RCAAgent()
compliance_agent = ComplianceAgent()
lessons_learned_agent = LessonsLearnedAgent()
risk_agent = RiskAgent()

class AgentRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Question or prompt instructions for the agent.")
    tag_number: Optional[str] = Field(None, description="Optional asset tag number (e.g., 'TK-101') to serve as context.")

@router.post("/agents/knowledge", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def run_knowledge_agent(request: AgentRequest):
    context = {"tag_number": request.tag_number} if request.tag_number else None
    result = knowledge_agent.execute(user_query=request.query, context_data=context)
    return APIResponse(
        success=True,
        message="Knowledge Agent query executed successfully",
        data=result
    )

@router.post("/agents/rca", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def run_rca_agent(request: AgentRequest):
    context = {"tag_number": request.tag_number} if request.tag_number else None
    result = rca_agent.execute(user_query=request.query, context_data=context)
    return APIResponse(
        success=True,
        message="RCA Agent query executed successfully",
        data=result
    )

@router.post("/agents/compliance", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def run_compliance_agent(request: AgentRequest):
    context = {"tag_number": request.tag_number} if request.tag_number else None
    result = compliance_agent.execute(user_query=request.query, context_data=context)
    return APIResponse(
        success=True,
        message="Compliance Agent query executed successfully",
        data=result
    )

@router.post("/agents/lessons-learned", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def run_lessons_learned_agent(request: AgentRequest):
    context = {"tag_number": request.tag_number} if request.tag_number else None
    result = lessons_learned_agent.execute(user_query=request.query, context_data=context)
    return APIResponse(
        success=True,
        message="Lessons Learned Agent query executed successfully",
        data=result
    )

@router.post("/agents/risk", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def run_risk_agent(request: AgentRequest):
    context = {"tag_number": request.tag_number} if request.tag_number else None
    result = risk_agent.execute(user_query=request.query, context_data=context)
    return APIResponse(
        success=True,
        message="Risk Agent query executed successfully",
        data=result
    )
