from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from backend.models import APIResponse
from backend.agents.router import GroqAgentRouter
from backend.agents.tools import AgentToolExecutor

router = APIRouter(tags=["Central Agent Router"])
agent_router = GroqAgentRouter()
tool_executor = AgentToolExecutor()

class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user question or command to the agent.")

@router.post("/agent/chat", response_model=APIResponse, status_code=status.HTTP_200_OK)
async def agent_chat_endpoint(request: AgentChatRequest):
    # 1. Classify prompt intent via Groq
    decision = agent_router.route_prompt(request.message)
    
    # 2. Execute local tool based on intent
    execution_result = tool_executor.execute_tool(
        intent=decision.intent,
        parameters=decision.parameters,
        reply_message=decision.reply_message
    )
    
    # 3. Assemble unified response
    response_data = {
        "intent": decision.intent,
        "confidence_score": decision.confidence_score,
        "parameters": decision.parameters,
        "answer": execution_result["answer"],
        "sources": execution_result.get("sources", []),
        "details": execution_result.get("details", None)
    }
    
    return APIResponse(
        success=True,
        message="Agent routing and execution completed successfully",
        data=response_data
    )
