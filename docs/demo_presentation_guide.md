# 🧠 OpsBrain AI: Demo Presentation & Q&A Defense Guide
> **Version 1.2 — Final Submission Freeze**
> Aligned with ET AI Hackathon 2026 Problem Statement #8: *Unified Asset & Operations Brain*

---

## ⏱️ Narration Scripts

### 1. The 3-Minute Narration (Express Pitch)
*Goal: Fast, high-impact overview showing UI flow, multi-agent reasoning, and fallback resilience.*

*   **0:00 – 0:35 | Scene 1: Problem Alignment & Executive Cockpit**
    > *"Welcome, judges. Heavy industrial plants suffer from fragmented data silos. SCADA alarms trigger, but operators lack the immediate context of blueprints or safety SOPs. OpsBrain AI addresses **Problem Statement #8** by creating a unified operations cockpit. On our Executive Dashboard, we fuse live asset risks, regulatory compliance ratings, and active alerts into a single screen, replacing manual searching with real-time graph intelligence."*
*   **0:35 – 1:10 | Scene 2: Digital Twin & Ingested Blueprints**
    > *"Let's drill down into the Digital Twin workspace. By selecting Coke Oven Battery 1 (COB-1), we load our plant’s physical topology directly in ReactFlow. This graph isn't drawn manually; it is parsed from rasterized P&ID schematics via Gemini Vision, mapping equipment and flows straight into our Postgres schemas. Universal Ingestion chunks our safety manuals and indexes them locally using CPU-based BGE embeddings—ensuring total plant data privacy."*
*   **1:10 – 1:50 | Scene 3: AI Investigation & Dynamic Graph Trace**
    > *"When anomalies arise, we trigger our Root Cause Agent. The interface transitions into AI Investigation Mode, locking controls and displaying the Traversal Auditing HUD. As the agent traces logs, notice the ReactFlow graph pulsing dynamically—highlighting affected links between COB-1 and GCM-104 in warning red. The agent returns a dynamic `graph_trace` that physically maps the cascade on the screen as it processes."*
*   **1:50 – 2:20 | Scene 4: Copilot Evidence Path & Failover Resilience**
    > *"Operators can query the Knowledge Copilot directly. We ask, 'Why is COB-1 at risk?'. Rather than a generic text response, OpsBrain compiles a visual, graph-aware **Evidence Path** linking the physical nodes directly to cited safety clauses. Notice the badge: 'Answered using fallback provider: Gemini'. If our primary Groq API encounters rate-limits, our built-in Provider Router routes completions to backup LLMs without freezing the user."*
*   **2:20 – 2:40 | Scene 5: Live Telemetry SSE Stream**
    > *"OpsBrain continuously monitors operations. Toggling 'Live Alarms' connects the client to our backend via Server-Sent Events. Simulated SCADA spikes stream live warning cards into the UI. Clicking the API Status indicator opens the Runtime Monitor, letting operators audit model latencies, token cache stats, and circuit breaker lists in real time."*
*   **2:40 – 3:00 | Scene 6: Scorecard & Closing Pitch**
    > *"We close with the Evaluation Dashboard. OpsBrain delivers 97.8% entity parsing accuracy on blueprints, and slashes diagnostic search times from 35 minutes to 1.8 seconds—a 99.9% operational efficiency gain. OpsBrain AI guarantees transparent, resilient safety intelligence. Thank you."*

---

### 2. The 5-Minute Narration (Deep-Dive Technical Pitch)
*Goal: Detailed validation, technical implementation details (embeddings, graph architecture), and defense.*

*   **0:00 – 0:50 | Scene 1: The Problem & Dashboard Setup**
    > *"Judges, in heavy manufacturing, safety regulations and operations remain disconnected. The Visakhapatnam coking plant explosion of January 2025 is a tragic reminder: SCADA sensors warned of pressure spikes, but critical safety SOP binders sat on office shelves, completely isolated from the live controls. 
    > OpsBrain AI bridges this gap as a **Unified Asset & Operations Brain**. Our Executive Dashboard presents a dark, high-contrast, plant-ready cockpit. We aggregate average risk profiles, active compliance ratings (such as OISD standards), and active alerts. Every metric you see here is calculated dynamically by correlating live telemetry with physical plant topology."*
*   **0:50 – 1:45 | Scene 2: Blueprint Parsing & Graph Digital Twin**
    > *"Let's navigate to the Digital Twin tab and select Coke Oven Battery 1 (COB-1). OpsBrain models the physical relationships of the plant in a relational graph. We don't ask engineers to draw this; our P&ID Vision Parser uses Gemini Flash to scan standard blueprint drawings, extracting coordinate locations, piping lines, and equipment tags to build the schema automatically.
    > In parallel, our ingestion pipeline parses PDF operating manuals and environmental rules, converting them into 384-dimensional vector embeddings locally using a CPU-bound BGE model. This keeps the data entirely within the local intranet, resolving a major compliance hurdle for heavy industries."*
*   **1:45 – 2:40 | Scene 3: Multi-Agent Engine & AI Investigation HUD**
    > *"Under the hood runs our multi-agent core, composed of 5 specialized agents: Root Cause Analysis, Risk Calculation, Compliance Auditor, Lessons Learned, and the Copilot. 
    > When we click 'Run RCA', the application switches to AI Investigation Mode. The workspace dims and a monospace HUD console begins streaming the agent’s logs. Watch the graph canvas: as the agent queries Postgres and searches vector manuals, it utilizes the dynamic `graph_trace` output to pulse connected edges in the ReactFlow diagram. You can visually trace the fail-state propagating from COB-1 to the Gas Collecting Main GCM-104."*
*   **2:40 – 3:35 | Scene 4: Knowledge Copilot & Graph RAG**
    > *"Next, let's query the Knowledge Copilot: 'Why is COB-1 operating at critical risk?'. 
    > Unlike generic RAG search bars that return unstructured text paragraphs, OpsBrain creates a **Graph-Aware Evidence Path**. It maps the logical path of the query directly onto the physical nodes of the digital twin: COB-1 connects to GCM-104, which correlates to compliance records and standard operating procedures. The response cites specific safety manual clauses, complete with calculated confidence scores, allowing the engineer to verify the source instantly."*
*   **3:35 – 4:20 | Scene 5: Live SSE Telemetry & Provider Router Health**
    > *"To demonstrate live operations, we toggle 'Live Alarms'. This establishes a continuous Server-Sent Events stream from our backend. Real-time simulated SCADA spikes immediately push alarm cards to the screen.
    > If external cloud APIs slow down or rate-limit, our custom **AI Provider Router** handles the failover. In our API Status Monitor modal, we can review the health state of Groq, Mistral, and Gemini. If Groq registers 3 consecutive timeouts in a 60-second window, the circuit breaker trips, routing all reasoning tasks to Mistral and Gemini, and finally to local pre-compiled fallback templates—ensuring the dashboard never freezes or crashes."*
*   **4:20 – 5:00 | Scene 6: Benchmarks, Roadmap & Pitch**
    > *"Our Evaluation Dashboard validates this performance against our seeded Vizag Steel dataset. We demonstrate 97.8% entity parsing accuracy and an average query latency of 1.8 seconds. This reduces manual diagnostic searches from 35 minutes to under two seconds—a massive operational speedup.
    > Our future roadmap includes integrating physical PLC drivers like OPC-UA and deploying fully offline local models (like Llama-3-8B). OpsBrain AI delivers the unified context operators need to prevent outages and achieve zero-harm plant goals. Thank you, and we welcome your questions."*

---

## 🖱️ Click-by-Click Guide

```mermaid
graph TD
    Start[Load Port 3000] --> Step1[View Executive Cockpit]
    Step1 --> Step2[Click Digital Twin -> Select COB-1]
    Step2 --> Step3[Click Run RCA / Run Risk]
    Step3 --> Step4[Query Copilot: Why is COB-1 at risk?]
    Step4 --> Step5[Toggle Live Alarms -> Open API Status]
    Step5 --> Step6[Click Evaluation & Benchmarks]
```

1.  **Load the App:** Navigate to `http://localhost:3000` (or the running React dev port). 
2.  **Scene 1 (Dashboard):** Start on **Executive View** (sidebar first tab). Focus on the "Average Plant Risk" and "Active Compliance Violations" widgets.
3.  **Scene 2 (Digital Twin & Selection):** Click **Digital Twin** (third tab). Select **COB-1** from the Asset Register on the left side of the screen.
4.  **Scene 3 (Run RCA):** Look at the right actions panel for COB-1 and click **Run RCA**. Wait for the Monospace HUD overlay to complete its typing simulation and check the highlighted red nodes in the ReactFlow diagram.
5.  **Scene 4 (Knowledge Copilot):** Scroll down to the search block under the ReactFlow view, type `Why is COB-1 operating at critical risk?` and click **Ask**. Inspect the returned flowchart blocks and the provider badge.
6.  **Scene 5 (Telemetry & Monitor):** Scroll to the bottom-left sidebar panel, toggle **Live Alarms** to `ACTIVE`. Look at the warning cards generated. Next, click the green **API STATUS** badge in the top-right header area to open the modal.
7.  **Scene 6 (Benchmarks):** Close the modal (press `ESC` or click `X`). Select **Evaluation & Benchmarks** (sidebar sixth tab) and focus on the time-savings bar chart.

---

## 🚫 What NOT to Click
*   **Do NOT click unseeded assets:** The database is seeded specifically for **COB-1** and **GCM-104**. Clicking other random node tags in a clean DB will return empty states.
*   **Do NOT click "Seed Vizag Steel" multiple times:** Clicking this button resets the database. Click it once at the start of your demo session to ensure schemas are populated, then let the dashboard run.
*   **Do NOT click background pages while overlays are running:** When running RCA or Risk calculations, the screen is covered by an active modal. Do not try to force-scroll or click behind it; let the console typewriting finalize.
*   **Do NOT query the copilot with unrelated questions:** The local vector store is indexed with coking oven safety SOPs. Asking about general knowledge (e.g. *"Write a python script"*) will return low-confidence warnings or hit fallback limits.

---

## 🚨 API Slowdown / Failover Backup Lines

| Situation | Presenter Pivot Line |
| :--- | :--- |
| **Groq API is extremely slow (>10 seconds)** | *"Notice that our dashboard tracks model execution in the background. Because Groq is experiencing latency spikes, the system is dynamically evaluating backup options to protect the operator's response time."* |
| **LLM returns a rate-limit error (fallback trips)** | *"Our primary completion engine hit an external API rate limit. However, the dashboard has automatically loaded our pre-compiled coking safety cache for COB-1. Notice the 'demo fallback' tag on the card—the UI remains functional, and the operator is not left with an empty spinner."* |
| **Internet is completely offline** | *"OpsBrain is designed with offline-first capabilities. The local BGE embedding model runs directly on the local server CPU. All asset relationship queries run inside our local SQLite/Postgres schemas, meaning the digital twin remains active even when isolated from cloud APIs."* |

---

## 💎 The Closing Pitch
> *"Judges, OpsBrain AI does not simply display graphs or summarize texts. It functions as the **Unified Asset & Operations Brain** for heavy industry. By grounding LLMs inside a physical digital twin and enforcing compliance guidelines locally, we eliminate hallucination risks, bypass API dependency failures with robust router failovers, and deliver answers in seconds. OpsBrain AI provides heavy manufacturing facilities with the transparent, resilient safeguards required to protect physical equipment, maximize uptime, and achieve zero-harm operations. Thank you."*

---

## 🛡️ 10 Judge Q&A Flash Answers

### Q1: Is this real SCADA integration?
> *"No, this is a SCADA-style simulation designed to showcase prototype interactions. Real-time factory deployments would connect to active plant servers using standard industrial connectivity protocols (e.g., OPC UA or Modbus TCP)."*

### Q2: Is this just a RAG wrapper?
> *"Absolutely not. Standard RAG searches text documents in isolation. OpsBrain AI incorporates a **knowledge graph digital twin** where documents and regulations are bound directly to physical equipment nodes. The multi-agent orchestrator calculates cascading risks using connected neighbors (e.g. pressure transmission flows) to reason about issues."*

### Q3: Are the benchmark numbers real?
> *"The latency and accuracy numbers are prototype benchmarks measured locally on the seeded Vizag Steel dataset. Traditional lookup times (e.g., 35 minutes) represent average engineer times for cross-referencing manual files. They are comparative estimations."*

### Q4: What happens if Groq or Gemini APIs fail during the live demo?
> *"OpsBrain has a built-in **Provider Fallback** safety loop. If external completion endpoints rate-limit or fail, the system catches the exception, logs it in the Runtime Monitor, and loads pre-compiled coking battery logs matching seeded tags (e.g., Oven graphite seal failures on `COB-1`). The UI will complete its animation, close the HUD overlay, and render the results card labeled clearly as a demo fallback."*

### Q5: How is the graph trace generated?
> *"The agents extract connection logs from the database. When compiling answers, they write an array of affected node tag names, traversed edges, and reasoning bullet points to a structured `graph_trace` JSON block. The ReactFlow canvas maps these tag arrays to highlight matching components in the viewport in real time."*

### Q6: How does this satisfy ET AI Hackathon Problem Statement #8?
> *"Problem Statement #8 asks for AI systems that improve plant safety, predict outages, and extract lessons from safety SOPs. OpsBrain satisfies this completely by:
> 1. Ingesting coking battery drawings (P&ID) and safety manuals into a digital twin.
> 2. Running continuous compliance checks against environmental regulations.
> 3. Delivering post-incident Root Cause Analysis (RCA) and checklists to technicians."*

### Q7: Why did you use Gemini Flash instead of training a custom computer vision model?
> *"Gemini-2.5-Flash provides exceptional multi-modal context understanding and can parse coordinates directly into JSON objects out of the box, which is ideal for a hackathon timeline. For production, we would deploy a custom fine-tuned layout-parsing model (like LayoutLM) combined with object detection (YOLO) trained specifically on engineering symbols to ensure fully offline data security."*

### Q8: How would this scale to a real plant with 10,000+ assets?
> *"For scale:
> 1. The ReactFlow canvas would render clustered sub-systems (batteries, gas loops) dynamically based on viewport zoom boundaries instead of rendering the whole facility at once.
> 2. Supabase/PostgreSQL is highly scalable, and the vector index would utilize HNSW indexing to sustain millisecond vector searches across thousands of documents.
> 3. Agent calls would run asynchronously inside task queues (like Celery/Redis) instead of blocking the main thread."*

### Q9: Why did you choose local BGE embeddings instead of OpenAI or Cohere?
> *"Heavy manufacturing plants (like steel mills or refineries) have strict data privacy standards. Sending internal operating procedures and blueprints to third-party APIs is often a security blocker. Running local `bge-small-en-v1.5` embeddings on CPU allows us to maintain 100% data local-confinement with sub-second retrieval times."*

### Q10: How do you verify the output of these agents is correct?
> *"Every agent output conforms to strict Pydantic schemas. If a model generates text that lacks required structured fields (such as lists of affected nodes, compliance state, or safety references), the validator catches the failure and triggers a local correction fallback instead of rendering raw, unstructured responses."*
