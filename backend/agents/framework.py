import json
from typing import Dict, Any, Type, TypeVar, Callable
from pydantic import BaseModel
from groq import Groq
from backend.config import settings, logger
from backend.models import OpsBrainException

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

    def execute_llm(self, prompt: str, schema_instruction: str = "") -> Dict[str, Any]:
        if not schema_instruction:
            schema_json = json.dumps(self.response_schema.model_json_schema(), indent=2)
            schema_instruction = (
                f"You MUST return a JSON object that strictly conforms to the following JSON schema at the ROOT level:\n"
                f"```json\n"
                f"{schema_json}\n"
                f"```\n"
                f"Do not nest your response under any other keys (like 'response' or similar). The keys of your output object must be exactly: "
                f"{', '.join(self.response_schema.model_fields.keys())}."
            )
        full_system = f"{self.system_prompt}\n\n{schema_instruction}"
        logger.info(f"Agent '{self.name}': Executing LLM completions...")
        
        last_error = None
        for attempt in range(2):
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.3-70b-versatile",
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                content = chat_completion.choices[0].message.content
                logger.debug(f"Agent '{self.name}' raw LLM reply: {content}")
                
                # Parse JSON
                data = json.loads(content)
                # Validate against Pydantic schema
                validated = self.response_schema(**data)
                return validated.model_dump()
            except Exception as e:
                logger.warning(f"Agent '{self.name}' validation failed on attempt {attempt + 1}: {e}")
                last_error = e
                # Self-correction feedback loop
                prompt = (
                    f"{prompt}\n\n"
                    f"[SYSTEM WARNING: Your previous response caused a JSON validation error: {e}.\n"
                    f"Please correct your output format and strictly conform to the schema.]"
                )
                
        raise OpsBrainException(
            f"Agent '{self.name}' failed to generate valid structured response after multiple attempts. Error: {last_error}", 
            code="AGENT_VALIDATION_FAILED"
        )
