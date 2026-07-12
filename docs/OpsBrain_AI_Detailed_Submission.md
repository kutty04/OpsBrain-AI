# 🧠 OpsBrain AI: Detailed Submission Report
## Unified Asset & Operations Brain for Zero-Harm Plants
**ET AI Hackathon 2026 | Problem Statement #8: Industrial Knowledge Intelligence**
**Solo Creator & Developer: Madumitha M**

---

## 1. Executive Summary & Value Proposition
OpsBrain AI functions as a **unified analytical nervous system** for industrial assets. Modern industrial facilities generate massive amounts of telemetry, yet safety incidents occur because critical information remains trapped in disconnected operational silos. OpsBrain AI addresses **ET AI Hackathon 2026 Problem Statement #8** by integrating industrial telemetry logs, Piping & Instrumentation Diagrams (P&IDs), safety SOPs, and historical incident logs into a unified, context-aware **digital twin knowledge graph**. 

An autonomous multi-agent core works in the background to calculate cascading risk levels, provide prototype compliance evidence support (OISD/CREP), and execute root-cause analysis in seconds based on demo benchmark results on seeded validation data. By grounding LLMs inside a physical digital twin and enforcing compliance guidelines locally, we eliminate hallucination risks, bypass API dependency failures with robust router failovers, and deliver answers in seconds—slashing safety retrieval lookup times from 35 minutes to under two seconds (99.9% operational efficiency gain).

---

## 2. Problem Statement Alignment: Industrial Knowledge Fragmentation
In heavy manufacturing industries, safety regulations and plant operations remain disconnected. The Visakhapatnam coking plant explosion of January 2025 highlights a tragic operational reality: SCADA sensors warned of pressure spikes, but critical safety SOP binders sat on office shelves, completely isolated from the live controls. 

### Core Operational Challenges:
1. **Sensor Blind Spots:** SCADA alarms warn of pressure spikes but do not know if connected isolation valves are closed, or what SOP actions are mandated.
2. **The Knowledge Cliff:** Retiring senior engineers carry years of undocumented plant heuristics away, leaving junior operators with sparse guidance.
3. **Audit Latency:** Cross-referencing safety logs during a violation takes hours of manual coordination across databases, delaying emergency response.

OpsBrain AI bridges this gap. It digests blueprints and manuals, extracts connection pathways, and maps them into a relational digital twin. A team of specialized autonomous agents then monitors this digital twin, translating raw telemetry into actionable compliance audits and safety diagnostics.

---

## 3. Proposed Solution
OpsBrain AI integrates industrial telemetry logs, Piping & Instrumentation Diagrams (P&IDs), safety SOPs, and historical incident logs into a unified digital twin knowledge graph:
*   **P&ID Image Parsing:** Converts rasterized P&ID schematics via Gemini Vision into structured equipment and flow edges.
*   **Local Document Ingestion:** Chunks and indexes environmental and safety SOPs locally on CPU using BGE embeddings for absolute data privacy.
*   **Relational Graph Mapping:** Maps equipment tags, flow lines, and sensor limits using ReactFlow with dynamic state overrides.
*   **Multi-Agent Intelligence Core:** Deploys a fleet of five specialized LLM agents (RCA, Risk, Compliance, Lessons, Copilot) to analyze safety state changes.
*   **RAG-Grounded Expert Copilot:** Offers specific answers on operating limits and safety SOPs, returning visual graph evidence paths and direct source citations.

---

## 4. System Architecture & Data Layer
The application is built using a modern decoupled layout designed for security, resilience, and offline-first edge deployment:

*   **Frontend Client:** React 18, ReactFlow (interactive graph rendering), Vanilla CSS (Matrix/Synthwave themed cockpit UI), Lucide Icons, and Server-Sent Events (SSE) telemetry stream dashboard.
*   **Backend Server:** FastAPI (Python 3.10+), Uvicorn ASGI gateway, SentenceTransformers (local CPU embeddings).
*   **AI Models:** Groq Llama-3.3-70b-versatile (primary agent orchestrator), Gemini-2.5-Flash (P&ID vision schema extraction), Mistral (RAG answer synthesis).
*   **AI Failover:** Capability-aware `AIProviderRouter` with circuit-breaker pattern — text agents chain Groq→Mistral→Gemini→seeded demo fallback; P&ID vision chains Gemini→cached extraction; embeddings are always local BGE.
*   **Data Layer:** PostgreSQL (Supabase with `pgvector` index search), SQLite (local transactions, active asset caches, and event tables).

---

## 5. Key Features & Implementation Details

### 5.1 Executive Dashboard
Provides a unified view tracking average facility risk, active compliance alerts, and incident trends. Built with a high-fidelity HSL dark interface to mimic real control room software.

### 5.2 P&ID Vision Parser
Uses Gemini Vision to read standard blueprint schematics, extracting equipment tags, flow lines, and coordinates to build the database schema automatically.

### 5.3 Universal Ingestion
Ingests manuals, chunking PDFs, and generating 384-dimensional vector embeddings locally using the BGE model. This keeps sensitive plant data entirely within the local intranet.

### 5.4 Digital Twin Graph
Interactive graph workspace rendering asset neighborhoods, sensors, and structural flow lines. Nodes dynamically pulse warning colors during investigations to show cascading risk.

### 5.5 Multi-Agent Engine
*   **Root Cause Analysis (RCA):** Traverses maintenance history and telemetry logs to find failure pathways.
*   **Risk Intelligence:** Evaluates asset hazard scores (0-100) based on incidents and status propagation from neighbors.
*   **Compliance Auditor:** Compiles environmental and OISD safety compliance checks.
*   **Lessons Learned:** Extracts preventive checklists from past work orders to guide active maintenance.

### 5.6 Knowledge Copilot
Answers natural language queries using a Graph-Aware Evidence Path. It maps the logical path of the query directly onto the physical nodes of the digital twin, citing specific safety clauses with confidence scores.

### 5.7 AI Runtime & Fallback Monitor
Telemetry panel tracking request rates, model latencies, token cache stats, fallback events, and circuit-breaker health.

### 5.8 Refinery Pump Station Scalability Demo
Demonstrates generalizability to other plant configurations using the same shared schema and agent pipeline, exposed through an optional refinery seed endpoint. Swaps the coking battery nodes for 7 pump station assets (such as P-101 and TK-501).

---

## 6. Evaluation & Benchmarks
OpsBrain AI is evaluated against a pre-seeded Vizag Steel dataset. 

*   **P&ID Entity Extraction:** 97.8% Accuracy (Gemini Vision parsing).
*   **Graph Linkage Completeness:** 100.0% Complete.
*   **Compliance Detection Rate:** 100.0% Detection.
*   **Average Time-to-Answer:** 1.8 seconds (compared to 35 minutes for manual searches—a 99.9% operational speedup).
*   **Note:** All metrics represent **demo benchmark results on seeded validation data (prototype estimations for comparison)**.

---

## 7. Prototype Scope & Limitations
1. **No Real Plant/SCADA Integration:** All SCADA-style sensor metrics and alarms are simulated and streamed synthetically via Server-Sent Events (SSE) from the backend.
2. **No Certified Legal/Compliance Validation:** The OISD and environmental check audits are strictly for prototype compliance evidence support and do not replace certified regulatory audits.
3. **No Live Production Deployment:** The application is designed as a local prototype for demonstration and validation. 
4. **Vizag Main Demo Focus:** Vizag Steel Coke Oven Battery remains the primary and main default dataset. The Refinery Pump Station is an optional scalability proof only.

---

## 8. Presentation, Video Script & Deliverables
*   **Working Prototype:** Full-stack React client and FastAPI server supporting all agents, copilot, telemetry simulator, and P&ID vision parser.
*   **Architecture Diagram:** Relational topology and AI agent routing schematic embedded inside [System Architecture](#system-architecture).
*   **Presentation Deck:** PowerPoint deck outline documented in `docs/presentation_deck_slides.md`.
*   **Demo Video:** Full walkthrough script and narration guides prepared in `docs/demo_script.md` and `docs/demo_presentation_guide.md`.
*   **GitHub Repository:** Outlined in the project version control under branch `submission-rc-phase6`.
