# OpsBrain AI: Demo Presentation Script (3-5 Minutes)

This script guides the presenter step-by-step through a professional, high-impact demonstration of **OpsBrain AI** for the ET AI Hackathon 2026 judges.

---

## ⏱️ Timeline & Click Guide

### 🎬 Scene 1: Executive Dashboard (0:00 - 0:45)
*   **What to do:** Open `http://localhost:3000` in the browser. Select the **"Executive View"** tab in the sidebar.
*   **What to click:** None yet. Point to the panels.
*   **Narration:**
    > *"Welcome judges. This is OpsBrain AI, the Unified Asset & Operations Brain for Zero-Harm coking plants. We are looking at our Executive Command Center. On the left, we track the overall Plant Risk Score and Compliance Rate, which are calculated by correlating active SCADA logs with vector-indexed safety regulations. At the bottom, our Alert Center aggregates live notifications, and our Action Register alerts inspectors to anomalies."*

---

### 🎬 Scene 2: Digital Twin & Topology (0:45 - 1:30)
*   **What to do:** Click the **"Digital Twin"** tab in the sidebar. Select **"COB-1"** (Coke Oven Battery 1) from the asset register list on the left.
*   **What to click:** Select **"COB-1"** button in the list.
*   **Narration:**
    > *"Let's select our Coke Oven Battery asset, COB-1. OpsBrain builds a digital twin directly from engineering blueprints. In the center, you see the active topology neighborhood rendering GCM-104 and its connected valves and transmitters. On the right, we show real-time circular risk meters and compliance grids."*

---

### 🎬 Scene 3: RCA & Dynamic Graph Trace HUD (1:30 - 2:15)
*   **What to do:** In the right actions panel under COB-1, click the **"Run RCA"** button.
*   **What to click:** **"Run RCA"** button.
*   **What to avoid:** Do not click anything else while the overlay is running.
*   **Narration:**
    > *"When an operator detects an anomaly, they run our specialized Root Cause Analysis agent. Notice that the entire screen dims, locking user input, and the AI Traversal HUD overlay appears. As the agent audits logs and parses safety manuals, it highlights the exact physical connection path in the topology map. COB-1 traverses to GCM-104, which flashes critical warning red. The console output streams real-time reasoning steps directly from the backend agent."*

---

### 🎬 Scene 4: Knowledge Copilot & Evidence Path (2:15 - 3:00)
*   **What to do:** Scroll down to the **"Knowledge Copilot"** terminal inside the twin tab. In the prompt bar, type: `Why is COB-1 at risk?` and press **Ask**.
*   **What to click:** Type prompt and click **"Ask"**.
*   **Narration:**
    > *"For natural language support, operators consult our Knowledge Copilot. We submit a query: 'Why is COB-1 at risk?'. Rather than a generic text response, OpsBrain outputs a Graph-Aware Evidence Path showing the exact flow: COB-1 ➔ GCM-104 ➔ compliance limits ➔ standard operating procedures. At the bottom, we provide direct citations to safety binders, complete with confidence levels."*

---

### 🎬 Scene 5: Live SCADA Telemetry & Runtime Monitor (3:00 - 3:45)
*   **What to do:** Toggle the **"Live Alarms"** simulator in the bottom left to `SIMULATING`. Click the green **"ONLINE / API STATUS"** button in the header.
*   **What to click:** **"Live Alarms"** toggle switch, then **"API STATUS"** header link.
*   **Narration:**
    > *"OpsBrain continuously monitors streaming SCADA data. We toggle 'Live Alarms' on. The interface connects via Server-Sent Events to our backend stream. As telemetry spikes occur, new alert cards flow into the console in real time. We open the AI Runtime Monitor to audit API request rates, average model latencies, token cache hits, and active connection states."*

---

### 🎬 Scene 6: Scalability Proof (3:45 - 4:15)
*   **What to do:** In the sidebar, click the **"Seed Refinery Demo"** button. Accept the confirmation dialog.
*   **What to click:** **"Seed Refinery Demo"** button.
*   **Narration:**
    > *"To demonstrate the portability of our architecture, we click 'Seed Refinery Demo' in our presentation controls. This clean-wipes the Vizag Steel Coke Oven Battery data and seeds a completely different facility—the Refinery Pump Station. Without changing any database schemas, router configurations, or agent code, the Digital Twin dynamically renders 7 pump station assets (such as P-101 and TK-501) on the ReactFlow canvas, proving the plant-agnostic scalability of our digital twin system."*

---

### 🎬 Scene 7: Evaluation Dashboard & Conclusion (4:15 - 4:45)
*   **What to do:** Select **"Evaluation & Benchmarks"** tab in the sidebar.
*   **What to click:** **"Evaluation & Benchmarks"** tab.
*   **Narration:**
    > *"We conclude with our Evaluation Dashboard. OpsBrain delivers 97.8% entity parsing accuracy on blueprints, and slashes safety retrieval lookups from 35 minutes to 1.8 seconds—a 99.9% operational efficiency gain. OpsBrain AI transforms industrial management, ensuring zero-harm operations through graph-aware safety intelligence. Thank you."*

---

## 🚨 Backup Plan (If API fails)
1.  **Demo Fallback Trigger:** If Groq or Gemini APIs fail due to rate limits during the presentation, the backend will catch the exception and inject structured Vizag fallback report templates.
2.  **Presenter Pivot:** If the results display `"Demo fallback: live AI provider unavailable"`, explain:
    > *"Notice that even with external LLM API rate limits, OpsBrain's built-in demo-safety fallback successfully captured the connectivity drop, logged the error in the Runtime Monitor, and loaded local cached coking logs without crashing the interface or locking the user."*
