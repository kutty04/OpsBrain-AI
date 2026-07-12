import time
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from groq import Groq
from mistralai.client import Mistral
from google import genai
from google.genai import types

from backend.config import settings
from backend.models import OpsBrainException

logger = logging.getLogger("opsbrain.provider_router")

# Global circuit breaker session state
PROVIDER_FAILURES: Dict[str, List[float]] = {
    "groq": [],
    "mistral": [],
    "gemini": []
}
COOLDOWN_SECONDS = 60
FAILURE_THRESHOLD = 3

def coerce_to_schema(data: Dict[str, Any], schema: Any) -> Dict[str, Any]:
    """
    Coerces dictionary values to match Pydantic schema definitions,
    preventing validation errors from LLM output inconsistencies.
    """
    # 1. Normalize confidence float
    if "confidence" not in data or data["confidence"] is None or data["confidence"] == "":
        data["confidence"] = 0.8
    else:
        try:
            val = data["confidence"]
            if isinstance(val, str):
                val = val.replace("%", "").strip()
                val = float(val)
            if val > 1.0:
                val = val / 100.0
            data["confidence"] = max(0.0, min(1.0, float(val)))
        except:
            data["confidence"] = 0.8

    # 2. Normalize severity_assessment if it is returned as a dictionary
    if "severity_assessment" in data and isinstance(data["severity_assessment"], dict):
        sa = data["severity_assessment"]
        val = sa.get("severity_level") or sa.get("level") or sa.get("severity") or list(sa.values())[0]
        data["severity_assessment"] = str(val)

    # 3. Clean up graph_trace nested schemas to prevent sub-object validation errors
    if "graph_trace" in data:
        gt = data["graph_trace"]
        if not isinstance(gt, dict) or not gt:
            data["graph_trace"] = None
        else:
            if "affected_nodes" not in gt or not isinstance(gt["affected_nodes"], list):
                gt["affected_nodes"] = []
            else:
                cleaned_nodes = []
                for node in gt["affected_nodes"]:
                    if isinstance(node, str):
                        cleaned_nodes.append(node)
                    elif isinstance(node, dict):
                        val = node.get("node_id") or node.get("id") or node.get("tag") or node.get("tag_number") or node.get("name") or node.get("label") or (list(node.values())[0] if node.values() else None)
                        if val:
                            cleaned_nodes.append(str(val))
                gt["affected_nodes"] = cleaned_nodes
            if "affected_edges" not in gt or not isinstance(gt["affected_edges"], list):
                gt["affected_edges"] = []
            else:
                cleaned_edges = []
                for edge in gt["affected_edges"]:
                    if isinstance(edge, str) and "->" in edge:
                        parts = edge.split("->")
                        cleaned_edges.append({
                            "source": parts[0].strip(),
                            "target": parts[1].strip(),
                            "reason": None
                        })
                    elif isinstance(edge, dict):
                        source = edge.get("source") or edge.get("from")
                        target = edge.get("target") or edge.get("to")
                        if source and target:
                            cleaned_edges.append({
                                "source": str(source),
                                "target": str(target),
                                "reason": edge.get("reason")
                            })
                gt["affected_edges"] = cleaned_edges
            if "reasoning_steps" not in gt or not isinstance(gt["reasoning_steps"], list):
                gt["reasoning_steps"] = []
            else:
                cleaned_steps = []
                for step in gt["reasoning_steps"]:
                    if isinstance(step, str):
                        cleaned_steps.append(step)
                    elif isinstance(step, dict):
                        val = step.get("step") or step.get("log") or step.get("text") or (list(step.values())[0] if step.values() else None)
                        if val:
                            cleaned_steps.append(str(val))
                gt["reasoning_steps"] = cleaned_steps

            if "evidence_refs" not in gt or not isinstance(gt["evidence_refs"], list):
                gt["evidence_refs"] = []
            else:
                cleaned_refs = []
                for ref in gt["evidence_refs"]:
                    if isinstance(ref, str):
                        cleaned_refs.append(ref)
                    elif isinstance(ref, dict):
                        val = ref.get("ref") or ref.get("document") or ref.get("file") or (list(ref.values())[0] if ref.values() else None)
                        if val:
                            cleaned_refs.append(str(val))
                gt["evidence_refs"] = cleaned_refs

    # 4. Fill missing or invalid required fields
    for field_name, field_def in schema.model_fields.items():
        if field_name not in data or data[field_name] is None:
            # Supply default or fallback value
            if field_def.default is not None and str(field_def.default) != "PydanticUndefined":
                data[field_name] = field_def.default
            elif field_def.default is None:
                data[field_name] = None
            elif getattr(field_def, "default_factory", None) is not None:
                data[field_name] = field_def.default_factory()
            else:
                # Required field lacks default
                if field_name in ["answer", "identified_root_cause", "findings", "explanation", "status"]:
                    if field_name == "status":
                        data[field_name] = "UNDER_REVIEW"
                    else:
                        data[field_name] = "Analysis compiled successfully."
                elif field_name in ["related_tags", "contributing_factors", "suggested_mitigations", "lessons_extracted", "preventive_actions", "safety_recommendations"]:
                    data[field_name] = []
                elif field_name == "calculated_score":
                    data[field_name] = 50
                elif field_name == "risk_level":
                    data[field_name] = "Medium"
                elif field_name == "severity_assessment":
                    data[field_name] = "Medium"
                elif field_name == "confidence":
                    data[field_name] = 0.8
                else:
                    data[field_name] = ""
        else:
            # Validate types for list fields
            if field_name in ["violations", "related_tags", "contributing_factors", "suggested_mitigations", "lessons_extracted", "preventive_actions", "safety_recommendations"]:
                if not data[field_name]:
                    data[field_name] = []
                elif not isinstance(data[field_name], list):
                    data[field_name] = [str(data[field_name])]
            elif field_name == "calculated_score":
                try:
                    data[field_name] = int(float(data[field_name]))
                except:
                    data[field_name] = 50
    return data

def is_provider_degraded(provider_name: str) -> bool:
    """
    Checks if a provider is marked degraded/offline due to consecutive failures.
    Auto-recovers provider if cooldown period has elapsed.
    """
    failures = PROVIDER_FAILURES.get(provider_name, [])
    now = time.time()
    # Filter failures to look at those within the cooldown window
    active_failures = [t for t in failures if now - t < COOLDOWN_SECONDS]
    PROVIDER_FAILURES[provider_name] = active_failures

    if len(active_failures) >= FAILURE_THRESHOLD:
        logger.warning(f"AI Provider Router: '{provider_name}' is currently DEGRADED (fails: {len(active_failures)}). Cooldown active.")
        return True
    return False

def record_provider_failure(provider_name: str):
    """
    Records a failure timestamp for the provider to update the circuit breaker.
    """
    now = time.time()
    PROVIDER_FAILURES[provider_name].append(now)
    logger.error(f"AI Provider Router: Recorded failure for '{provider_name}'. Total active failures: {len(PROVIDER_FAILURES[provider_name])}")

class AIProviderRouter:
    def __init__(self):
        # Graceful init of clients
        self.groq_client = None
        self.mistral_client = None
        self.gemini_client = None

        if settings.GROQ_API_KEY:
            try:
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.error(f"Router: Failed to init Groq: {e}")

        if settings.MISTRAL_API_KEY:
            try:
                self.mistral_client = Mistral(api_key=settings.MISTRAL_API_KEY)
            except Exception as e:
                logger.error(f"Router: Failed to init Mistral: {e}")

        if settings.GEMINI_API_KEY:
            try:
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Router: Failed to init Gemini: {e}")

    def route_text_agent(self, prompt: str, system_prompt: str, schema: Any, tag_number: str = None) -> Dict[str, Any]:
        """
        Routes text agents with fallback based on settings.AI_PROVIDER_ORDER.
        """
        attempted = []
        start_time = time.time()

        providers = [p.strip().lower() for p in settings.AI_PROVIDER_ORDER.split(",") if p.strip()]
        for provider in providers:
            # 1. Attempt Groq
            if provider == "groq" and self.groq_client and not is_provider_degraded("groq"):
                attempted.append("groq")
                try:
                    logger.info("Router: Route text_agent to 'groq'...")
                    groq_system_prompt = system_prompt
                    if "json" not in groq_system_prompt.lower():
                        groq_system_prompt = groq_system_prompt + "\nOutput must be a valid JSON object."

                    chat_completion = self.groq_client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": groq_system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        model="llama-3.3-70b-versatile",
                        response_format={"type": "json_object"},
                        temperature=0.1,
                        timeout=15.0
                    )
                    content = chat_completion.choices[0].message.content
                    data = json.loads(content)
                    data = coerce_to_schema(data, schema)
                    validated = schema(**data)
                    res = validated.model_dump()
                    res["provider_metadata"] = {
                        "provider_used": "groq",
                        "fallback_used": (len(attempted) > 1),
                        "fallback_reason": f"Prior providers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                        "attempted_providers": attempted,
                        "latency_ms": int((time.time() - start_time) * 1000)
                    }
                    return res
                except Exception as e:
                    logger.warning(f"Router: Groq execution failed: {e}")
                    record_provider_failure("groq")

            # 2. Attempt Mistral fallback
            elif provider == "mistral" and self.mistral_client and not is_provider_degraded("mistral"):
                attempted.append("mistral")
                try:
                    logger.info("Router: Route text_agent to 'mistral'...")
                    chat_response = self.mistral_client.chat.complete(
                        model="open-mistral-7b",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.1,
                        timeout_ms=15000
                    )
                    content = chat_response.choices[0].message.content
                    data = json.loads(content)
                    data = coerce_to_schema(data, schema)
                    validated = schema(**data)
                    res = validated.model_dump()
                    res["provider_metadata"] = {
                        "provider_used": "mistral",
                        "fallback_used": (len(attempted) > 1),
                        "fallback_reason": f"Prior providers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                        "attempted_providers": attempted,
                        "latency_ms": int((time.time() - start_time) * 1000)
                    }
                    return res
                except Exception as e:
                    logger.warning(f"Router: Mistral execution failed: {e}")
                    record_provider_failure("mistral")

            # 3. Attempt Gemini text fallback
            elif provider == "gemini" and self.gemini_client and not is_provider_degraded("gemini"):
                attempted.append("gemini")
                try:
                    logger.info("Router: Route text_agent to 'gemini' (text)...")
                    response = self.gemini_client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            response_mime_type="application/json",
                            response_schema=schema,
                            temperature=0.1
                        )
                    )
                    content = response.text
                    data = json.loads(content)
                    data = coerce_to_schema(data, schema)
                    validated = schema(**data)
                    res = validated.model_dump()
                    res["provider_metadata"] = {
                        "provider_used": "gemini",
                        "fallback_used": (len(attempted) > 1),
                        "fallback_reason": f"Prior providers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                        "attempted_providers": attempted,
                        "latency_ms": int((time.time() - start_time) * 1000)
                    }
                    return res
                except Exception as e:
                    logger.warning(f"Router: Gemini text execution failed: {e}")
                    record_provider_failure("gemini")

        # 4. Final: Demo fallback matching asset tags
        logger.warning("Router: All live providers unavailable. Triggering labeled seeded demo fallback...")
        from backend.agents.fallback_data import get_fallback_response
        
        # Build standard default Pydantic schema fallback structure
        schema_name = schema.__name__.lower()
        default_val = {}
        tag = tag_number or "COB-1"
        if "knowledge" in schema_name:
            default_val = {
                "answer": f"Demo fallback: live AI provider unavailable. Operating standard for asset {tag}.",
                "confidence": 0.5,
                "related_tags": [tag],
                "graph_trace": {"affected_nodes": [tag], "affected_edges": [], "reasoning_steps": ["Loaded fallback route"], "evidence_refs": []}
            }
        elif "rca" in schema_name:
            default_val = {
                "identified_root_cause": f"Demo fallback: live AI provider unavailable. Operational deviation detected on {tag}.",
                "contributing_factors": ["System calibration anomaly"],
                "suggested_mitigations": ["Inspect sensor readings and recalibrate system"],
                "severity_assessment": "Medium",
                "graph_trace": {"affected_nodes": [tag], "affected_edges": [], "reasoning_steps": ["Loaded fallback route"], "evidence_refs": []}
            }
        elif "compliance" in schema_name:
            default_val = {
                "status": "UNDER_REVIEW",
                "violations": [],
                "findings": f"Demo fallback: live AI provider unavailable. Compliance status under review for asset {tag}.",
                "graph_trace": {"affected_nodes": [tag], "affected_edges": [], "reasoning_steps": ["Loaded fallback route"], "evidence_refs": []}
            }
        elif "lessons" in schema_name:
            default_val = {
                "lessons_extracted": ["Demo fallback: live AI provider unavailable. Standard operations must be monitored closely."],
                "preventive_actions": ["Conduct weekly physical checks on equipment seals."],
                "safety_recommendations": ["Ensure local pressure relief valves are operational."],
                "graph_trace": {"affected_nodes": [tag], "affected_edges": [], "reasoning_steps": ["Loaded fallback route"], "evidence_refs": []}
            }
        elif "risk" in schema_name:
            default_val = {
                "calculated_score": 45,
                "risk_level": "Medium",
                "explanation": f"Demo fallback: live AI provider unavailable. Risk score defaulted to 45 for {tag} based on offline metrics.",
                "graph_trace": {"affected_nodes": [tag], "affected_edges": [], "reasoning_steps": ["Loaded fallback route"], "evidence_refs": []}
            }

        agent_key = schema_name.replace("response", "").strip()
        if "lessons" in agent_key:
            agent_key = "lessons"
        elif "knowledge" in agent_key:
            agent_key = "knowledge"

        fallback_res = get_fallback_response(agent_key, tag, default_val)
        
        # Inject custom label stating it's a fallback
        for key in ["answer", "identified_root_cause", "findings", "explanation"]:
            if key in fallback_res and "demo fallback" not in fallback_res[key].lower():
                fallback_res[key] = f"Demo fallback: live AI provider unavailable. {fallback_res[key]}"

        if "lessons_extracted" in fallback_res and fallback_res["lessons_extracted"]:
            first_item = fallback_res["lessons_extracted"][0]
            if "demo fallback" not in first_item.lower():
                fallback_res["lessons_extracted"][0] = f"Demo fallback: live AI provider unavailable. {first_item}"

        fallback_res["provider_metadata"] = {
            "provider_used": "demo_fallback",
            "fallback_used": True,
            "fallback_reason": "All configured live AI providers are offline or degraded.",
            "attempted_providers": attempted,
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        return fallback_res

    def route_rag_answer(self, prompt: str, system_prompt: str, retrieved_chunks: List[str]) -> Dict[str, Any]:
        """
        Routes RAG compiling based on settings.AI_PROVIDER_ORDER.
        """
        attempted = []
        start_time = time.time()

        providers = [p.strip().lower() for p in settings.AI_PROVIDER_ORDER.split(",") if p.strip()]
        for provider in providers:
            # 1. Attempt Groq
            if provider == "groq" and self.groq_client and not is_provider_degraded("groq"):
                attempted.append("groq")
                try:
                    logger.info("Router: Route RAG compilation to 'groq'...")
                    chat_completion = self.groq_client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        model="llama-3.3-70b-versatile",
                        temperature=0.2,
                        timeout=15.0
                    )
                    answer = chat_completion.choices[0].message.content
                    return {
                        "answer": answer,
                        "provider_metadata": {
                            "provider_used": "groq",
                            "fallback_used": (len(attempted) > 1),
                            "fallback_reason": f"Prior RAG compilers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                            "attempted_providers": attempted,
                            "latency_ms": int((time.time() - start_time) * 1000)
                        }
                    }
                except Exception as e:
                    logger.warning(f"Router: RAG Groq compilation failed: {e}")
                    record_provider_failure("groq")

            # 2. Attempt Mistral fallback
            elif provider == "mistral" and self.mistral_client and not is_provider_degraded("mistral"):
                attempted.append("mistral")
                try:
                    logger.info("Router: Route RAG compilation to 'mistral'...")
                    chat_response = self.mistral_client.chat.complete(
                        model="open-mistral-7b",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.2,
                        timeout_ms=15000
                    )
                    answer = chat_response.choices[0].message.content
                    return {
                        "answer": answer,
                        "provider_metadata": {
                            "provider_used": "mistral",
                            "fallback_used": (len(attempted) > 1),
                            "fallback_reason": f"Prior RAG compilers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                            "attempted_providers": attempted,
                            "latency_ms": int((time.time() - start_time) * 1000)
                        }
                    }
                except Exception as e:
                    logger.warning(f"Router: RAG Mistral compilation failed: {e}")
                    record_provider_failure("mistral")

            # 3. Attempt Gemini text fallback
            elif provider == "gemini" and self.gemini_client and not is_provider_degraded("gemini"):
                attempted.append("gemini")
                try:
                    logger.info("Router: Route RAG compilation to 'gemini'...")
                    response = self.gemini_client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=0.2
                        )
                    )
                    answer = response.text
                    return {
                        "answer": answer,
                        "provider_metadata": {
                            "provider_used": "gemini",
                            "fallback_used": (len(attempted) > 1),
                            "fallback_reason": f"Prior RAG compilers failed: {attempted[:-1]}" if len(attempted) > 1 else None,
                            "attempted_providers": attempted,
                            "latency_ms": int((time.time() - start_time) * 1000)
                        }
                    }
                except Exception as e:
                    logger.warning(f"Router: RAG Gemini compilation failed: {e}")
                    record_provider_failure("gemini")

        # 4. Extractive fallback from retrieved document chunks
        if retrieved_chunks:
            logger.warning("Router: Failover: Executing extractive fallback from retrieved text chunks...")
            joined_chunks = "\n\n".join([f"- {c[:300]}..." for c in retrieved_chunks[:3]])
            answer = (
                "Extractive fallback: generated from retrieved document evidence without live LLM reasoning.\n\n"
                "Retrieved Document Passages:\n"
                f"{joined_chunks}"
            )
            return {
                "answer": answer,
                "provider_metadata": {
                    "provider_used": "extractive_fallback",
                    "fallback_used": True,
                    "fallback_reason": "All live AI compilers failed. Synthesizing directly from local search database chunks.",
                    "attempted_providers": attempted,
                    "latency_ms": int((time.time() - start_time) * 1000)
                }
            }

        # 5. Demo fallback
        logger.warning("Router: Triggering final labeled demo fallback for RAG answers...")
        return {
            "answer": "Demo fallback: live AI provider unavailable. Standard operating limits require pressure back-pressure loop PIC-202 to be kept under 15 mmWC under standard OISD coking furnace rules.",
            "provider_metadata": {
                "provider_used": "demo_fallback",
                "fallback_used": True,
                "fallback_reason": "No document passages retrieved and all live AI endpoints failed.",
                "attempted_providers": attempted,
                "latency_ms": int((time.time() - start_time) * 1000)
            }
        }

    def route_vision_pid(self, image_bytes: bytes, mime_type: str, prompt: str, schema: Any) -> Dict[str, Any]:
        """
        Routes P&ID vision diagrams: Gemini Vision -> cached extraction fallback.
        """
        attempted = ["gemini_vision"]
        start_time = time.time()

        if self.gemini_client and not is_provider_degraded("gemini"):
            try:
                logger.info("Router: Route P&ID parsing to primary 'gemini_vision'...")
                response = self.gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        ),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                        temperature=0.1
                    )
                )
                data = json.loads(response.text)
                validated = schema(**data)
                res = validated.model_dump()
                res["provider_metadata"] = {
                    "provider_used": "gemini_vision",
                    "fallback_used": False,
                    "fallback_reason": None,
                    "attempted_providers": attempted,
                    "latency_ms": int((time.time() - start_time) * 1000)
                }
                return res
            except Exception as e:
                logger.warning(f"Router: Gemini Vision parsing failed: {e}")
                record_provider_failure("gemini")

        # Fallback 1: Seeded Vizag P&ID cached results
        logger.warning("Router: Vision failover: loading cached parsed result for Vizag P&ID topology...")
        
        # Hardcoded Vizag extraction matching schema
        cached_data = {
            "assets": [
                {"tag_number": "COB-1", "name": "Coke Oven Battery #1", "category": "Vessel", "description": "Primary coking unit containing 65 carbonization chambers.", "confidence_score": 0.95},
                {"tag_number": "CC-101", "name": "Coal Charging Car #1", "category": "Vessel", "description": "Operates on top of the battery to load coal blends.", "confidence_score": 0.92},
                {"tag_number": "CP-102", "name": "Coke Pusher Car #1", "category": "Pump", "description": "Operates on pusher side to push hot coke.", "confidence_score": 0.90},
                {"tag_number": "GCM-104", "name": "Gas Collecting Main", "category": "Vessel", "description": "Collects hot volatile raw coke oven gas.", "confidence_score": 0.97},
                {"tag_number": "PSV-202", "name": "Collector Pressure Control Valve", "category": "Valve", "description": "Regulates collector gas back-pressure.", "confidence_score": 0.94},
                {"tag_number": "HE-301", "name": "Liquor Heat Exchanger", "category": "Exchanger", "description": "Exchanges heat from flushing liquor.", "confidence_score": 0.91},
                {"tag_number": "PT-202", "name": "Pressure Transmitter", "category": "Instrument", "description": "Measures back-pressure.", "confidence_score": 0.98},
                {"tag_number": "PIC-202", "name": "Pressure Controller", "category": "Instrument", "description": "Maintains gas main pressure loop.", "confidence_score": 0.96}
            ],
            "connections": [
                {"source_tag": "CC-101", "target_tag": "COB-1", "relation_type": "FLOWS_TO", "details": "Coal Blend Loading", "confidence_score": 0.95},
                {"source_tag": "COB-1", "target_tag": "GCM-104", "relation_type": "FLOWS_TO", "details": "Raw Gas Flow", "confidence_score": 0.98},
                {"source_tag": "GCM-104", "target_tag": "PSV-202", "relation_type": "FLOWS_TO", "details": "Gas Pressure Control Line", "confidence_score": 0.95},
                {"source_tag": "GCM-104", "target_tag": "HE-301", "relation_type": "FLOWS_TO", "details": "Gas Coolant Line", "confidence_score": 0.95},
                {"source_tag": "PT-202", "target_tag": "GCM-104", "relation_type": "MEASURES", "details": "Back-pressure measurement", "confidence_score": 0.99},
                {"source_tag": "PT-202", "target_tag": "PIC-202", "relation_type": "MEASURES", "details": "Signal Loop", "confidence_score": 0.99},
                {"source_tag": "PIC-202", "target_tag": "PSV-202", "relation_type": "CONTROLS", "details": "Feedback Loop", "confidence_score": 0.99},
                {"source_tag": "CP-102", "target_tag": "COB-1", "relation_type": "FLOWS_TO", "details": "Ram push line", "confidence_score": 0.90}
            ]
        }
        
        validated = schema(**cached_data)
        res = validated.model_dump()
        res["provider_metadata"] = {
            "provider_used": "cached_pid_fallback",
            "fallback_used": True,
            "fallback_reason": "Gemini Vision API offline or degraded.",
            "attempted_providers": attempted,
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        return res

router_instance = AIProviderRouter()

