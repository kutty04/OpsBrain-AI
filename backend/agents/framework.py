import json
from typing import Dict, Any, Type, TypeVar, Callable
from pydantic import BaseModel
from groq import Groq
from backend.config import settings, logger
from backend.models import OpsBrainException
from backend.agents.provider_router import AIProviderRouter

router_instance = AIProviderRouter()

T = TypeVar("T", bound=BaseModel)

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}

    def register_tool(self, name: str, func: Callable):
        self._tools[name] = func
        logger.info(f"Registered agent tool: {name}")

    def call_tool(self, name: str, *args, **kwargs) -> Any:
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' is not registered in the ToolRegistry")
        try:
            logger.info(f"Invoking tool '{name}'...")
            return self._tools[name](*args, **kwargs)
        except Exception as e:
            logger.error(f"Error executing tool '{name}': {e}")
            raise e

class BaseAgent:
    def __init__(self, name: str, system_prompt: str, response_schema: Type[BaseModel]):
        self.name = name
        self.system_prompt = system_prompt
        self.response_schema = response_schema
        
        if not settings.GROQ_API_KEY:
            logger.error(f"BaseAgent '{self.name}': GROQ_API_KEY is not configured!")
            raise OpsBrainException("Groq API Key is missing", code="GROQ_API_KEY_MISSING")
        try:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Groq Client in BaseAgent: {e}")
            raise OpsBrainException(f"Failed to initialize Groq: {e}", code="GROQ_INIT_FAILED")

    def _build_default_fallback(self, tag: str) -> Dict[str, Any]:
        schema_name = self.response_schema.__name__.lower()
        if "knowledge" in schema_name:
            return {
                "answer": f"Demo fallback: live AI provider unavailable. Operating standard for asset {tag}.",
                "confidence": 0.5,
                "related_tags": [tag],
                "graph_trace": {
                    "affected_nodes": [tag],
                    "affected_edges": [],
                    "reasoning_steps": ["Loaded fallback route"],
                    "evidence_refs": []
                }
            }
        elif "rca" in schema_name:
            return {
                "identified_root_cause": f"Demo fallback: live AI provider unavailable. Operational deviation detected on {tag}.",
                "contributing_factors": ["System calibration anomaly"],
                "suggested_mitigations": ["Inspect sensor readings and recalibrate system"],
                "severity_assessment": "Medium",
                "graph_trace": {
                    "affected_nodes": [tag],
                    "affected_edges": [],
                    "reasoning_steps": ["Loaded fallback route"],
                    "evidence_refs": []
                }
            }
        elif "compliance" in schema_name:
            return {
                "status": "UNDER_REVIEW",
                "violations": [],
                "findings": f"Demo fallback: live AI provider unavailable. Compliance status under review for asset {tag}.",
                "graph_trace": {
                    "affected_nodes": [tag],
                    "affected_edges": [],
                    "reasoning_steps": ["Loaded fallback route"],
                    "evidence_refs": []
                }
            }
        elif "lessons" in schema_name:
            return {
                "lessons_extracted": ["Demo fallback: live AI provider unavailable. Standard operations must be monitored closely."],
                "preventive_actions": ["Conduct weekly physical checks on equipment seals."],
                "safety_recommendations": ["Ensure local pressure relief valves are operational."],
                "graph_trace": {
                    "affected_nodes": [tag],
                    "affected_edges": [],
                    "reasoning_steps": ["Loaded fallback route"],
                    "evidence_refs": []
                }
            }
        elif "risk" in schema_name:
            return {
                "calculated_score": 45,
                "risk_level": "Medium",
                "explanation": f"Demo fallback: live AI provider unavailable. Risk score defaulted to 45 for {tag} based on offline metrics.",
                "graph_trace": {
                    "affected_nodes": [tag],
                    "affected_edges": [],
                    "reasoning_steps": ["Loaded fallback route"],
                    "evidence_refs": []
                }
            }
        return {}

    def execute_llm(self, prompt: str, schema_instruction: str = "", tag_number: str = None) -> Dict[str, Any]:
        logger.info(f"Agent '{self.name}': Routing completion requests through Provider Router...")
        try:
            return router_instance.route_text_agent(
                prompt=prompt,
                system_prompt=self.system_prompt,
                schema=self.response_schema,
                tag_number=tag_number
            )
        except Exception as e:
            logger.error(f"Agent '{self.name}': AI Provider Router execution failed: {e}")
            raise OpsBrainException(
                f"Agent routing failed: {e}",
                code="AGENT_ROUTING_FAILED"
            )
