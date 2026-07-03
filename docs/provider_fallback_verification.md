# OpsBrain AI: Provider Fallback & Demo Safety Verification

This report documents the robustness and error-capturing architecture of the **OpsBrain AI** multi-agent pipeline during API service disruptions (e.g. Groq rate-limiting, Mistral timeouts, or Gemini offline states).

---

## 1. Backend Error Trapping & Router Fallback Loop

In `backend/agents/provider_router.py`, all LLM completions are executed within an active router validation block:

1.  **AI Provider Router (`AIProviderRouter`):** All specialized reasoning agents, Knowledge Copilot, and P&ID vision parser calls are routed through the provider router.
2.  **Sequential Fallback Chain:**
    *   *Reasoning Agents:* Groq (llama-3.3-70b-versatile) ➔ Mistral (open-mistral-7b) ➔ Gemini (gemini-2.5-flash text) ➔ Seeded Demo Fallback.
    *   *RAG Copilot:* Groq ➔ Mistral ➔ Gemini text ➔ Local Extractive Fallback ➔ Seeded Demo Fallback.
    *   *Vision Diagram Parser:* Gemini Vision ➔ Cached Vizag P&ID Schema Fallback.
3.  **Circuit Breaker Protection:** The router tracks consecutive provider failures. If a provider registers 3 failures inside a 60-second window, the circuit trips, and the provider is temporarily cooled down for 60 seconds, routing all requests around it.
4.  **Failure Cooldown Lists:** Degraded endpoints are marked in-memory, avoiding blocking latency penalties on subsequent queries.

---

## 2. Verified Fallback Card Payload

Fallback results return structured properties conforming to Pydantic validation schemas. Below is a sample payload returned during a simulated API disruption:

*   **Identified Root Cause:** `"Oven #12 fugitive door seal leaks caused by graphite rope compression failure under thermal cycling."`
*   **Wording & Visual Labeling:** The router attaches a `provider_metadata` block to the returned dictionary:
    ```json
    "provider_metadata": {
        "provider_used": "demo_fallback",
        "fallback_used": true,
        "fallback_reason": "Primary and backup LLM providers returned rate limit / timeouts.",
        "attempted_providers": ["groq", "mistral", "gemini"],
        "latency_ms": 12
    }
    ```
*   **Transparent UI Indicators:** The React frontend parses `provider_metadata` and displays a status badge: `"Demo fallback: live AI provider unavailable"`, keeping the demonstration transparent.

---

## 3. UI Gracefulness & Prevention of Crashes

1.  **No Infinite Spinners:** Because the API response (even if it's a fallback) is returned cleanly to the controller, the React animation sequence finishes, the HUD modal closes, and the results card mounts normally.
2.  **Runtime Monitor Logs:** Telemetry counters increment error counts (`errs`) and transition provider status rows (e.g., Groq) from `ONLINE` to `DEGRADED` or `OFFLINE` dynamically inside `frontend/src/App.jsx` based on the attempted providers list in response metadata.
3.  **ErrorBoundary Safety:** The root container is wrapped in a visual `ErrorBoundary` to catch any UI render crashes, presenting a clean recovery card instead of a blank white screen.
