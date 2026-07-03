# OpsBrain AI: System Architecture & Data Flow Diagrams

This document contains Mermaid diagrams illustrating the backend components, multi-agent frameworks, telemetry streams, and logical flows for **OpsBrain AI** (v1.2).

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Client [React Frontend UI]
        Dashboard[App.jsx Dashboard & Metrics]
        FlowGraph[ReactFlow Topology Viewer]
        Monitor[AI Telemetry & Fallback Monitor]
        Evaluation[Evaluation & Benchmark Dashboard]
    end

    subgraph Gateway [FastAPI Route Gateway]
        Router[FastAPI Routing Controller]
    end

    subgraph Services [FastAPI Backend Services]
        VisionService[Gemini P&ID Vision Extractor]
        IngestPipeline[SOP Chunker & Embedder]
        AgentEngine[Multi-Agent Orchestrator]
        TelemetryStream[SSE Telemetry Broadcaster]
    end

    subgraph Persistence [Data & Inference Layer]
        RelationalDB[(PostgreSQL / SQLite Metadata)]
        VectorDB[(pgvector Semantic Store)]
        LLM[Groq LLaMA 3.3 API / Gemini Flash API]
    end

    Dashboard -->|HTTP Requests| Router
    FlowGraph -->|Get Graph Edges| Router
    Monitor -->|Get Logs / SSE stream| Router
    Evaluation -->|Benchmark specs| Router

    Router -->|POST /api/v1/pid/parse| VisionService
    Router -->|POST /api/v1/ingest| IngestPipeline
    Router -->|POST /api/v1/agents/*| AgentEngine
    Router -->|GET /api/v1/telemetry/stream| TelemetryStream

    VisionService -->|Insert Nodes & Edges| RelationalDB
    IngestPipeline -->|bge-small-en-v1.5 Vectors| VectorDB
    AgentEngine -->|Correlate Safety SOPs| VectorDB
    AgentEngine -->|Call LLM completions| LLM
    
    RelationalDB -->|Asset Topology Map| FlowGraph
```

---

## 2. Multi-Agent Reasoning Flow

```mermaid
graph TD
    Request[User Trigger: Run Agent / RCA] --> Context[Retrieve Asset Details & Neighbor Risks]
    Context --> DB[Fetch Historical Incidents & Maintenance logs]
    DB --> Prompt[Compile Prompt & Pydantic Schema Instructions]
    Prompt --> LLMAttempt{Call Groq LLM}
    LLMAttempt -->|Success| Validate{Validate JSON Schema}
    LLMAttempt -->|Failed / Rate-limit| Fallback[Retrieve Offline fallback_data.py]
    Validate -->|Success| Output[Return structured JSON response]
    Validate -->|Failed| Retry[Self-Correction Prompt Attempt 2]
    Retry --> LLMAttempt
    Fallback --> Output
    Output --> Log[Persist Lessons learned in Postgres / Update Risk Scores]
```

---

## 3. Graph Trace Visualization Flow

```mermaid
graph TD
    Agent[Agent execution completes] --> Parse[Parse JSON graph_trace properties]
    Parse --> Trace[Extract affected_nodes & affected_edges]
    Trace --> Frontend[Update activeGraphTrace state in App.jsx]
    Frontend --> FlowCanvas[Pass activeGraphTrace to GraphVisualizer]
    FlowCanvas --> Nodes[Match nodes in affected_nodes ➔ Pulse yellow/red warnings]
    FlowCanvas --> Edges[Match edges in affected_edges ➔ Highlight flow lines & animate dashes]
```

---

## 4. Telemetry SSE Stream Flow

```mermaid
graph TD
    Toggle[Toggle Live Alarms: SIMULATING] --> Connect[Open EventSource Stream http://127.0.0.1:8000/api/v1/telemetry/stream]
    Connect --> SSEOpen{SSE Connection open?}
    SSEOpen -->|Yes| Stream[Yield synthetic JSON events every 8 seconds]
    SSEOpen -->|No / Error| Local[Trigger local mock alarm simulation interval]
    Stream --> Parse[Parse message in App.jsx]
    Parse --> Update[Update alert center, alerts count, and average risk metrics]
    Local --> Update
```
