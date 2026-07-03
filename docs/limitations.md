# OpsBrain AI: System Limitations & Engineering Roadmap

This document outlines the architectural boundaries and pre-production limitations of the **OpsBrain AI** (e.g. v1.2) prototype, together with the future engineering roadmap.

---

## 1. Prototype Boundaries & Limitations

### 📡 Telemetry Stream
*   **Limitation:** SCADA telemetry is generated synthetically on the backend by `backend/routers/telemetry.py`.
*   **Impact:** Cannot be used in production out of the box without linking to a live factory server (e.g. OPC-UA, MQTT, or Modbus).

### 📐 P&ID Vision Extraction
*   **Limitation:** Gemini-2.5-Flash Vision parses diagram shapes based on LLM visual heuristics.
*   **Impact:** Highly complex engineering diagrams with overlapping text, non-standard symbols, or low resolutions may result in coordinate drift or missing node relationships.

### 🌐 Cloud API Dependency
*   **Limitation:** LLM completions rely on external cloud APIs (Groq and Gemini).
*   **Impact:** Network latency fluctuations can delay agent reasoning times. High API utilization might trigger rate limits (mitigated for demo through fallback handling in this prototype).

### 📂 Embeddings Parsing
*   **Limitation:** Vector embeddings are generated locally on CPU using `bge-small-en-v1.5`.
*   **Impact:** Ingestion of massive document vaults (1,000+ PDFs) will require dedicated GPU servers or cloud-based embedding providers to maintain sub-second chunking index times.

---

## 2. Future Production Roadmap

1.  **Industrial SCADA Drivers:** Integrate python-opcua and MQTT client libraries to poll sensor metrics directly from physical PLCs.
2.  **Fine-Tuned Symbol Object Detection:** Deploy a local YOLOv8 object detection model trained specifically on ISA-5.1 P&ID instrumentation symbols to eliminate cloud API reliance for blueprints parsing.
3.  **Edge Deployments:** Deploy local LLM models (e.g., Llama-3-8B-Instruct) inside the plant network using Ollama or vLLM to ensure zero data leakage.
4.  **Relay Interlocking Checks:** Generate automated isolation valve checklists when critical pressure deviations are detected on collector mains, preventing dangerous manual errors.
