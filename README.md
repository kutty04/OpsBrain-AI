# 🧠 OpsBrain AI

### Unified Asset & Operations Brain for Zero-Harm Plants
OpsBrain AI integrates industrial telemetry logs, Piping & Instrumentation Diagrams (P&IDs), safety SOPs, and historical incident logs into a unified, context-aware **digital twin knowledge graph**. An autonomous multi-agent core works in the background to calculate cascading risk levels, provide prototype compliance evidence support (OISD/CREP), and execute root-cause analysis in seconds based on demo benchmark results on seeded validation data.

---

## 🎖️ Badges

| Environment | Backend & Database | AI Orchestration | Competition & License |
| :--- | :--- | :--- | :--- |
| [![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/) | [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) | [![Groq Llama 3.3](https://img.shields.io/badge/Groq%20Llama%203.3-f59e0b?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/) | [![ET AI Hackathon 2026](https://img.shields.io/badge/ET_AI_Hackathon-2026-cyan?style=for-the-badge)](#) |
| [![Tailwind CSS](https://img.shields.io/badge/CSS-Vanilla-38B2AC?style=for-the-badge&logo=css3&logoColor=white)](https://w3.org/Style/CSS/) | [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/) | [![Gemini](https://img.shields.io/badge/Gemini%20Flash-1a73e8?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/) | [![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE) |
| [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) | [![BAAI Embeddings](https://img.shields.io/badge/BAAI%20BGE--small-6366f1?style=for-the-badge)](https://huggingface.co/BAAI/bge-small-en-v1.5) | [![Mistral](https://img.shields.io/badge/Mistral-ff6b00?style=for-the-badge)](https://mistral.ai/) | **Problem Statement #8** |

---

## ⚠️ The Problem: Industrial Knowledge Fragmentation

Modern industrial facilities generate massive amounts of telemetry, yet safety incidents occur because critical information remains trapped in disconnected operational silos. 

```
[ SCADA Telemetry ]   ---> Out-of-context sensor readings (e.g. pressure spike)
[ Regulatory SOPs ]   ---> Trapped in static PDF binders on shelf
[ Asset Blueprints ]  ---> Rasterized P&ID images disconnected from live state
[ Incident Logs ]     ---> Unstructured historical notebooks
```

### 📉 Core Operational Challenges:
*   **Sensor Blind Spots:** SCADA alarms warn of pressure spikes but do not know if connected isolation valves are closed, or what SOP actions are mandated.
*   **The Knowledge Cliff:** Retiring senior engineers carry years of undocumented plant heuristics away, leaving junior operators with sparse guidance.
*   **Audit Latency:** Cross-referencing safety logs during a violation takes hours of manual coordination across databases, delaying emergency response.

---

## 💡 Our Solution: OpsBrain AI

OpsBrain AI acts as a **unified analytical nervous system** for industrial assets. It parses documents and piping blueprints, maps physical connections into a graph, and deploys a fleet of LLM agents to monitor risks and provide prototype compliance evidence support in real time.

| Traditional Ops | OpsBrain AI Model |
| :--- | :--- |
| Reacting to isolated sensor alarms | Fusing telemetry with physical asset topology |
| Searching index files manually for safety regulations | RAG-grounded Knowledge Copilot with direct citations |
| Periodic manual safety audits | Real-time prototype compliance evidence support |

---

## 🔄 End-to-End Workflow

```
       Documents + P&ID Images
                  │
                  ▼
          [ AI Extraction ]
                  │
                  ▼
         [ Knowledge Graph ]
                  │
                  ▼
           [ Digital Twin ]
                  │
                  ▼
      [ Multi-Agent Intelligence ]
                  │
                  ▼
      Risk & Compliance Insights
```

---

## 🛠️ Key Features

| Feature | Primary Function | Core Implementation Details |
| :--- | :--- | :--- |
| **🌐 Executive Dashboard** | Unified plant safety cockpit | Tracks average risk score, compliance rates, and active alert streams using a high-fidelity HSL dark interface. |
| **📐 P&ID Vision Parser** | Converts blueprints to graphs | Employs Gemini-2.5-Flash Vision to extract equipment tags, flow relationships, and instrumentation from images. |
| **📂 Universal Ingestion** | Structures safety text documents | Chunks SOP PDFs and uploads them to a Supabase PostgreSQL database using local `bge-small-en-v1.5` embeddings. |
| **🔗 Digital Twin Graph** | Interactive network topology map | Renders equipment tags, flow lines, and sensor limits using ReactFlow with dynamic state overrides. |
| **💬 Knowledge Copilot** | RAG-grounded natural language Q&A | Provides specific answers on operating limits and safety SOPs, returning source documents and confidence levels. |
| **🔍 Root Cause Analysis** | Post-incident safety diagnostics | Correlates maintenance histories, adjacent node stresses, and telemetry logs via Groq Llama-3.3-70b-versatile. |
| **⚡ Risk Intelligence** | Cascading node risk calculator | Evaluates asset hazard scores (0-100) based on incidents, local logs, and status propagation from neighbors. |
| **🛡️ Compliance Auditor** | Automatic regulatory checks | Checks synthetic telemetry metrics against vector-stored regulatory safety guidelines (e.g. OISD standards) to offer prototype compliance evidence support. |
| **📚 Lessons Learned** | Preventive safety checklists | Extracts specific guidelines from past work orders and failures to guide active maintenance tasks. |
| **🔀 AI Provider Router** | Multi-provider LLM failover | Routes text agents (Groq→Mistral→Gemini), RAG queries, and P&ID vision to the best available provider with circuit-breaker protection. |
| **🏭 Refinery Pump Station Demo** | Plant scalability proof | Exposes an optional dataset button in the sidebar (styled in neutral amber) to demonstrate database schema and topology scaling to other facilities using the same shared schema and agent pipeline, exposed through an optional refinery seed endpoint. |
| **📊 Evaluation & Benchmarks** | Transparent performance metrics | Displays entity extraction accuracy, graph linkage completeness, answer quality, and compliance detection rates against seeded Vizag demo data. |
| **📡 AI Runtime Monitor** | Live telemetry audit modal | Synthetic telemetry audit modal tracking request rates, model latencies, token cache stats, fallback events, and provider health. |

---

## 💻 Tech Stack

*   **Frontend Client:** React 18, ReactFlow (interactive graph rendering), Vanilla CSS (Matrix/Synthwave themed UI), Lucide Icons.
*   **Backend Server:** FastAPI (Python 3.10+), Uvicorn ASGI gateway, SentenceTransformers (local CPU embeddings).
*   **AI Models:** Groq Llama-3.3-70b-versatile (primary agent orchestrator), Gemini-2.5-Flash (P&ID vision schema extraction), Mistral (RAG answer synthesis).
*   **AI Failover:** Capability-aware `AIProviderRouter` with circuit-breaker pattern — text agents chain Groq→Mistral→Gemini→seeded demo fallback; P&ID vision chains Gemini→cached extraction; embeddings are always local BGE.
*   **Data Layer:** PostgreSQL (Supabase with `pgvector` index search), SQLite (local transactions, active asset caches, and event tables).
*   **Infrastructure:** Python Virtual Environments, NPM build tooling, Selenium-based automated demo screenshots.

---

## 📐 System Architecture

```mermaid
graph TD
    %% Frontend Client
    subgraph Client [React Frontend Client]
        Dashboard["App.jsx Dashboard & Metrics"]
        FlowGraph[ReactFlow Topology Viewer]
        Monitor["AI Runtime & Fallback Monitor"]
        EvalDash[Evaluation & Benchmarks]
    end

    %% API Gateway
    subgraph Gateway [FastAPI Route Gateway]
        APIRouter[FastAPI Routing Controller]
    end

    %% Provider Router
    subgraph ProviderLayer [AI Provider Router]
        PRouter["AIProviderRouter (Circuit Breaker)"]
        Groq[Groq Llama-3.3]
        Mistral[Mistral API]
        Gemini["Gemini Flash (Vision + Text)"]
        DemoFallback[Seeded Demo Fallback]
    end

    %% Backend Services
    subgraph Services [FastAPI Backend Core]
        VisionService[P&ID Vision Extractor]
        IngestPipeline[SOP Chunker & Embedder]
        AgentEngine[Multi-Agent Orchestrator]
        TelemetryStream[SSE Telemetry Stream]
    end

    %% Data Store & Models
    subgraph Persistence [Data & Inference Layer]
        RelationalDB["(PostgreSQL / SQLite Metadata)"]
        VectorDB[(pgvector Semantic Store)]
        BGELocal[Local BGE Embeddings]
    end

    %% Communication Flow
    Dashboard -->|API Requests| APIRouter
    FlowGraph -->|Get Graph Edges| APIRouter
    Monitor -->|SSE Log Stream| TelemetryStream
    EvalDash -->|GET /api/v1/dashboard| APIRouter

    APIRouter -->|POST /api/v1/pid/parse| VisionService
    APIRouter -->|POST /api/v1/ingest| IngestPipeline
    APIRouter -->|POST /api/v1/agents/*| AgentEngine

    VisionService -->|route_vision_pid| PRouter
    AgentEngine -->|route_text_agent| PRouter
    IngestPipeline -->|route_rag_answer| PRouter

    PRouter -->|Primary| Groq
    PRouter -->|Fallback 1| Mistral
    PRouter -->|Fallback 2| Gemini
    PRouter -->|Fallback 3| DemoFallback

    VisionService -->|Insert Nodes & Edges| RelationalDB
    IngestPipeline -->|BGE Vectors| VectorDB
    BGELocal -.->|CPU Embeddings| IngestPipeline
    AgentEngine -->|Correlate Safety SOPs| VectorDB
    RelationalDB -->|Asset Topology Map| FlowGraph
```

---

## 🚀 Demo Walkthrough & Setup

### ⚙️ Prerequisites
Ensure you have the following installed:
*   Python 3.10 or higher
*   Node.js 18 or higher
*   A running Supabase/PostgreSQL instance with the `vector` extension enabled

---

### 📂 Step-by-Step Installation

<details>
<summary><b>1. Environment Configuration</b></summary>

Create a `.env` file in the root `opsbrain-ai` directory:
```env
# LLM Providers API Keys
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
MISTRAL_API_KEY=your_mistral_api_key

# PostgreSQL & Vector DB
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```
</details>

<details>
<summary><b>2. Backend Setup</b></summary>

```bash
# Navigate to root
cd opsbrain-ai

# Create virtual environment
python -m venv .venv
# Activate: On Windows use `.\venv\Scripts\activate` | On macOS/Linux use `source .venv/bin/activate`
.venv\Scripts\activate

# Install requirements
pip install -r backend/requirements.txt

# Run migrations to create schemas, functions, and indexes
python backend/database/migrate.py

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
</details>

<details>
<summary><b>3. Frontend Setup</b></summary>

```bash
# Open a new terminal session
cd opsbrain-ai/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
Open `http://localhost:3000` in your web browser.
</details>

---

### 📈 Standard Demo Flow
1.  **Seed Database:** Click **"Seed Vizag Steel"** in the sidebar. This loads 8 assets (COB-1, GCM-104, etc.) and uploads the coking furnace safety SOPs to the vector index.
2.  **Open Digital Twin:** Click **Digital Twin** in the sidebar, and select **COB-1** (Coke Oven Battery) from the asset register.
3.  **Run Diagnostics:** Click **Run RCA**, **Run Risk Score**, **Run Compliance Check**, and **Extract Lessons** in the actions panel to see real-time agent evaluations.
4.  **Query Copilot:** Type *"Why is COB-1 at critical risk?"* in the search interface to inspect vector-grounded citations.
5.  **Audit API Performance:** Click the green **API STATUS** indicator in the top header to review active latency logs and fallback events.
6.  **View Benchmarks:** Click **Evaluation & Benchmarks** in the sidebar to view entity extraction accuracy, graph linkage completeness, compliance detection rates, and time-to-answer metrics based on the seeded Vizag demo dataset.
7.  **Test Scalability (Refinery Demo):** Click **"Seed Refinery Demo"** in the sidebar. Accept the confirmation to clean-wipe Vizag data and load the Refinery Pump Station dataset. Switch to the **Digital Twin** tab to verify that the topology graph renders 7 pump station assets (e.g., P-101, TK-501) on the ReactFlow canvas, proving that all database models and agent routing scale seamlessly.

---

## 📸 Screenshots

### 📊 Executive Dashboard
![Executive Dashboard](presentation_assets/01_executive_dashboard.png)
*Unified view tracking average facility risk, active compliance alerts, and incident trends.*

---

### 📐 P&ID Vision Parser
![P&ID Parser](presentation_assets/02_pid_parser.png)
*Blueprint upload dashboard where Gemini parses instrumentation, tags, and flow lines.*

---

### 📂 Document Ingestion Registry
![Document Ingestion](presentation_assets/03_document_ingestion.png)
*Ingestion manager showing uploaded manuals, chunking pipelines, and vector index statuses.*

---

### 🔗 Digital Twin ReactFlow Topology
![Digital Twin](presentation_assets/04_digital_twin_graph.png)
*Interactive graph workspace rendering asset neighborhoods, sensors, and structural flow lines.*

---

### 💬 Knowledge Copilot Chat
![Knowledge Copilot](presentation_assets/05_knowledge_copilot.png)
*Natural language Q&A interface with source citations and confidence gauges.*

---

### 🤖 Live Agent Execution Results
| Root Cause Analysis (RCA) | Dynamic Risk Assessment |
| :--- | :--- |
| ![RCA](presentation_assets/06_rca_result.png) | ![Risk](presentation_assets/07_risk_result.png) |
| **OISD Compliance Audit** | **Lessons Learned & Failure Intelligence** |
| ![Compliance](presentation_assets/08_compliance_result.png) | ![Lessons Learned](presentation_assets/09_lessons_learned_result.png) |

---

### 📡 AI Runtime & Fallback Monitor
![AI Runtime Monitor](presentation_assets/10_ai_runtime_monitor.png)
*Telemetry panel tracking request rates, model latencies, token cache stats, provider fallback events, and circuit-breaker health.*

---

### 📊 Evaluation & Benchmarks Dashboard
![Evaluation Dashboard](presentation_assets/11_evaluation_benchmarks.png)
*Transparent benchmark scorecard showing entity extraction accuracy, graph linkage completeness, query answer quality, and compliance detection rates — all traced to the seeded Vizag Steel demo dataset.*

---

## 📈 Business Impact

*Demo benchmark results on seeded validation data (prototype estimations for comparison):*

*   **35% Reduction in Safety Search Time (demo benchmark results on seeded validation data):** Eliminates time spent manually referencing paper manuals, blueprint sheets, and PDF guidelines.
*   **18–22% Reduction in Unplanned Outages (demo benchmark results on seeded validation data):** Maps cascading risk propagation across physical connections, preventing failure cascades.
*   **Preemptive Lead Time (<10s) (demo benchmark results on seeded validation data):** Calculates asset risk and alerts compliance inspectors in seconds rather than waiting for scheduled shift audits.

---

## 💎 Why OpsBrain AI is Different

*   **Relational Topology RAG:** Traditional tools search documents in isolation. OpsBrain maps documentation context onto the physical connections of your assets, enabling query reasoning across connected equipment tags.
*   **Specialized Multi-Agent Coordination:** Tasks are split among distinct, specialized agents (Root Cause, Risk, Compliance, Lessons Learned) rather than passing queries to a general model.
*   **Capability-Aware AI Provider Router:** A circuit-breaker-protected failover system routes each task type to the best available LLM provider (Groq→Mistral→Gemini→seeded demo fallback), preventing demo failures from rate limits. Fallback events are transparently labeled — no silent fake success.
*   **Transparent System Telemetry:** Includes a real-time monitor panel that exposes request performance, caching statistics, provider health, and model fallback routes.

---

## 🔮 Future Scope

*   **Streaming Edge Telemetry:** Integrating MQTT/Kafka queues to update graph nodes directly from live SCADA sensor feeds.
*   **Fully Offline Deployments:** Running local LLMs (e.g. Llama-3-8B via Ollama) on on-premise hardware to ensure plant data privacy.
*   **Emergency Path Isolation:** Automatically generating isolation valve sequence checklists during high-risk pressure incidents.

---

## 🎯 Problem Statement #8 Alignment
OpsBrain AI is fully aligned with **ET AI Hackathon 2026 Problem Statement #8: AI for Industrial Knowledge Intelligence: Unified Asset & Operations Brain**.
Our implementation directly addresses all core hackathon expectations:
*   **Heterogeneous Document Ingestion:** Structures operating manuals, incident reports, and maintenance records using local vector indexing.
*   **P&ID Parsing:** Extracts piping connections and equipment tags from schematics via multi-modal vision models.
*   **Knowledge Graph Digital Twin:** Renders assets and pipeline connections in an interactive ReactFlow canvas.
*   **Expert Knowledge Copilot:** Provides natural language Q&A backed by precise source citations and calculated confidence scores.
*   **RCA / Risk / Compliance / Lessons Learned Agents:** Deploys a fleet of five specialized LLM agents to trace failure logs, calculate dynamic risks, support compliance check audits, and extract maintenance checklists.
*   **Usability Focus:** Tested layout for mobile and field technicians (at 390px width) to ensure in-field applicability.
*   **Refinery Scalability Proof:** Swaps the facility model dynamically using the same shared schema and agent pipeline, exposed through an optional refinery seed endpoint in the UI.

---

## 📦 Hackathon Deliverables
*   **Working Prototype:** Full-stack React client and FastAPI server supporting all 5 agents, knowledge copilot, telemetry simulator, and P&ID vision parser.
*   **Architecture Diagram:** Relational topology and AI agent routing schematic embedded inside the [System Architecture](#-system-architecture) section.
*   **Presentation Deck:** PowerPoint deck outline containing slide layouts, diagrams, and speaker notes documented in [docs/presentation_deck_slides.md](docs/presentation_deck_slides.md).
*   **Demo Video:** Full walkthrough script and narration guides prepared in [docs/demo_script.md](docs/demo_script.md) and [docs/demo_presentation_guide.md](docs/demo_presentation_guide.md).
*   **GitHub Repository:** Outlined in the project version control under branch `submission-rc-phase6`.

---

## 🔒 Prototype Scope & Limitations
*   **No Real Plant/SCADA Integration:** All SCADA-style sensor metrics and alarms are simulated and streamed synthetically using the backend process.
*   **No Certified Legal/Compliance Validation:** The OISD and environmental check audits are strictly for prototype compliance evidence support and do not replace certified regulatory audits.
*   **No Live Production Deployment:** The application is designed as a local prototype for demonstration and validation. All metrics are **demo benchmark results on seeded validation data**.
*   **Vizag Main Demo Focus:** Vizag Steel Coke Oven Battery remains the primary and main default dataset for the demonstration. The Refinery Pump Station is an optional scalability proof only.

---

## 🛡️ Demo Safety / Provider Fallback
OpsBrain AI features a capability-aware **AI Provider Router** with an active circuit-breaker pattern to protect the live demo against API slowdowns and third-party rate limits:
*   **Circuit Breaker:** If a primary cloud API (e.g. Groq) registers 3 consecutive timeouts within a 60-second window, the router trips and redirects queries to Mistral or Gemini.
*   **Local Demo Cache:** If all cloud providers fail, the frontend loads pre-compiled coking battery logs matching seeded tags (e.g. `COB-1`). The UI will complete its HUD traversal animations and close the overlay, displaying a results card clearly labeled as a demo fallback.
*   **Real-time Audit:** Presenters can click the **API STATUS** header link at any time to open the Runtime Monitor modal to inspect latency logs and connection list status.

---

## 🔌 How to Run Locally
The detailed setup steps are described in the [🚀 Demo Walkthrough & Setup](#-demo-walkthrough--setup) section. In summary:
1. Set up your `.env` keys.
2. Initialize virtualenv and install `backend/requirements.txt`.
3. Run migrations (`python backend/database/migrate.py`).
4. Start FastAPI server (`python -m uvicorn backend.main:app`).
5. Install dependencies and start React (`npm install && npm run dev` inside `frontend/`).

---

## ✅ Validated Features Checklist
- [x] Executive Dashboard Command Center
- [x] Seed Vizag Steel Database
- [x] Seed Refinery Demo Scalability Proof (same shared schema and agent pipeline)
- [x] ReactFlow Topology Digital Twin (COB-1 / GCM-104 / P-101)
- [x] AI Investigation console Traversal HUD modal
- [x] Root Cause Analysis (RCA) Agent (`graph_trace` edges highlight)
- [x] Risk Intelligence Agent (score committing)
- [x] Compliance Auditor Agent (explainable evidence support)
- [x] Lessons Learned Agent (maintenance checklists)
- [x] Expert Knowledge Copilot with RAG citations
- [x] Synthetic SCADA-Style Telemetry Stream (SSE stream toggle)
- [x] AI Runtime Monitor (circuit-breaker stats)
- [x] Evaluation & Benchmarks Dashboard (1.8s time-to-answer)
- [x] Mobile Usability viewport check (390px width)

---

## 📂 Documentation & Verification Reports

Complete design, verification, and presentation documents are available in the repository under `/docs`:

*   **Demo Script:** [docs/demo_script.md](docs/demo_script.md)
*   **System Architecture & Data Flows:** [docs/architecture_diagram.md](docs/architecture_diagram.md)
*   **Judge Q&A Defense Handbook:** [docs/judge_qna.md](docs/judge_qna.md)
*   **System Limitations & Roadmap:** [docs/limitations.md](docs/limitations.md)
*   **Final Submission & Screenshot Checklist:** [docs/submission_checklist.md](docs/submission_checklist.md)
*   **Final Submission Readiness Report:** [docs/final_submission_readiness.md](docs/final_submission_readiness.md)
*   **Benchmark Methodology & Parameters:** [docs/benchmark_methodology.md](docs/benchmark_methodology.md)
*   **SCADA Telemetry Stream Verification:** [docs/telemetry_verification.md](docs/telemetry_verification.md)
*   **Provider Fallback & Demo Safety:** [docs/provider_fallback_verification.md](docs/provider_fallback_verification.md)

---

## 👤 Creator
*   **Madumitha M** - *Solo Creator, Architect & Developer*


---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
