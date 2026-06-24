import os
import json
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from groq import Groq
from backend.config import settings, logger
from backend.models import OpsBrainException

class RoutingDecision(BaseModel):
    intent: str = Field(..., description="Intent: 'RAG_QUERY', 'GRAPH_QUERY', 'GENERAL_CONVERSATION'")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Extracted parameters for the tool")
    reply_message: Optional[str] = Field(None, description="Direct text response for GENERAL_CONVERSATION")

class GroqAgentRouter:
    def __init__(self):
        if not settings.GROQ_API_KEY:
            logger.error("GroqAgentRouter: GROQ_API_KEY is not configured!")
            raise OpsBrainException("Groq API Key is missing", code="GROQ_API_KEY_MISSING")
        try:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("GroqAgentRouter: Groq Client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Groq Client: {e}")
            raise OpsBrainException(f"Failed to initialize Groq: {e}", code="GROQ_INIT_FAILED")

    def route_prompt(self, prompt: str) -> RoutingDecision:
        system_instruction = (
            "You are the central intelligence agent router for the OpsBrain AI plant digital twin.\n"
            "Your task is to classify the user's intent and extract arguments for the appropriate tool.\n\n"
            "Available Intents:\n"
            "1. 'RAG_QUERY': Use when the user is asking questions about equipment operation, safety manuals, Standard Operating Procedures (SOPs), compliance regulations, or safety histories.\n"
            "   Parameters to extract:\n"
            "   - 'query': str (The search query to match against documents)\n"
            "   - 'limit': int (Optional, default 3)\n"
            "2. 'GRAPH_QUERY': Use when the user is asking about connections, flow loops, shortest path, or equipment neighborhoods.\n"
            "   Parameters to extract:\n"
            "   - 'action': str (Either 'shortest_path' or 'neighborhood')\n"
            "   - 'source_tag': str (For shortest path, e.g. 'TK-101')\n"
            "   - 'target_tag': str (For shortest path, e.g. 'FIC-101')\n"
            "   - 'start_tag': str (For neighborhood traversal, e.g. 'E-101')\n"
            "   - 'depth': int (Optional, default 2)\n"
            "3. 'GENERAL_CONVERSATION': Use when the user is saying hello, asking who you are, or asking general questions that do not map to the above categories.\n"
            "   Parameters: None.\n\n"
            "You must output a JSON object strictly conforming to this schema:\n"
            "{\n"
            "  \"intent\": \"RAG_QUERY\" | \"GRAPH_QUERY\" | \"GENERAL_CONVERSATION\",\n"
            "  \"confidence_score\": float (0.0 to 1.0),\n"
            "  \"parameters\": { ... },\n"
            "  \"reply_message\": string (optional response for GENERAL_CONVERSATION)\n"
            "}"
        )
        try:
            logger.info(f"Calling Groq llama-3.3-70b-versatile for intent classification: '{prompt[:50]}...'")
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_instruction
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.0
            )
            response_text = chat_completion.choices[0].message.content
            logger.debug(f"Groq routing raw response: {response_text}")
            result_json = json.loads(response_text)
            return RoutingDecision(**result_json)
        except Exception as e:
            logger.error(f"Groq routing classification failed: {e}")
            raise OpsBrainException(f"Agent routing failed: {e}", code="AGENT_ROUTING_FAILED")
