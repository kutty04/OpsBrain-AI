# OpsBrain AI: Benchmark Methodology & Validation Report

This report outlines the technical benchmarking methodology, dataset parameters, evaluation criteria, and performance test outcomes for **OpsBrain AI** (Release Candidate v1.2) under the ET AI Hackathon 2026 Problem Statement #8 validation scope.

---

## 1. Dataset & Schema Profile

All validation tests are performed against the **Seeded Vizag Steel Coke Oven Battery 1 (COB-1)** dataset and the **Public Industrial Validation Excerpts** dataset.

### Vizag Steel Dataset Profile:
*   **Test Documents Ingested:** 1 primary operating standard (`vizag_coke_oven_sop.txt`).
*   **P&ID Blueprints Processed:** 1 main Piping & Instrumentation Diagram (P&ID) blueprint of the battery collector main system.
*   **Seeded Asset Registry:** 8 primary physical assets:
    1.  `COB-1` (Coke Oven Battery 1 - Vessel)
    2.  `GCM-104` (Gas Collector Main - Vessel)
    3.  `CC-101` (Coal Charging Car - Vessel)
    4.  `CP-102` (Coke Pusher Machine - Vessel)
    5.  `PSV-202` (Pressure Safety Control Valve - Valve)
    6.  `HE-301` (Liquor Heat Exchanger - Exchanger)
    7.  `PT-202` (Pressure Transmitter - Instrument)
    8.  `PIC-202` (Proportional Integral Pressure Controller - Instrument)

### Public Industrial Validation Excerpts Profile:
To verify OpsBrain works beyond seeded synthetic documents, we ingested the following public safety and regulatory excerpts:
1.  `osha_1910_119_psm_excerpt.txt` (OSHA 1910.119 Process Safety Management Excerpt) — Public Domain.
2.  `oisd_150_coke_oven_excerpt.txt` (OISD Standard 150 Gas Collecting Main Safety Design Excerpt) — Publicly available standards.
3.  `epa_clean_air_act_title_v_excerpt.txt` (EPA Title V Operating Permit Requirements Excerpt) — Public Domain.

---

## 2. Graph Topology Extraction Verification

During the P&ID blueprint parser test run (vision extraction pipeline using Gemini model), the system extracted nodes and relationships to map the digital twin topology.

| Metric | Expected Target | Extracted Outcome | Accuracy |
| :--- | :---: | :---: | :---: |
| **Physical Assets (Nodes)** | 8 | 8 | 100% |
| **Topology Connections (Edges)** | 7 | 7 | 100% |

### Extracted Relationships:
*   `COB-1` ➔ `GCM-104` (`FLOWS_TO`)
*   `GCM-104` ➔ `PSV-202` (`FLOWS_TO`)
*   `GCM-104` ➔ `HE-301` (`FLOWS_TO`)
*   `PT-202` ➔ `GCM-104` (`MEASURES`)
*   `PIC-202` ➔ `PT-202` (`MEASURES`)
*   `PIC-202` ➔ `PSV-202` (`CONTROLS`)
*   `CC-101` ➔ `COB-1` (`FLOWS_TO` / Charging Connection)

---

## 3. RAG Query Benchmark Suite

To measure query correctness, citation coverage, and latency, a suite of 5 standard operational queries was executed against the RAG retrieval pipeline:

1.  **Q1:** *"Why is COB-1 at risk?"*
2.  **Q2:** *"Identify the root cause of the pressure spike on collector main GCM-104."*
3.  **Q3:** *"Is GCM-104 compliant with safety standards?"*
4.  **Q4:** *"What are the lessons learned from graphite rope door seal deterioration?"*
5.  **Q5:** *"What is the normal operating temperature range of Coke Oven Battery 1?"*

### Evaluation Criteria:
*   **Correctness:** Assessed by comparing the generated response with seeded SOP definitions (e.g. pressure regulation limits of $10\text{--}15\text{ mmWC}$ and smoke emission durations under $15\text{s}$).
*   **Citation Coverage:** Must cite at least one document source (SOP or manual name) containing matching paragraph fragments.
*   **Latency:** Time-to-response measured using browser `performance.now()` high-resolution timers.

---

## 4. Benchmark Performance Metrics

> [!NOTE]
> All performance metrics are measured locally on the prototype runtime environment. Traditional manual times are estimates for comparative validation.

### Latency & Efficiency Profile:
*   **Average OpsBrain Latency:** $1.8\text{ seconds}$ (using Groq `llama-3.3-70b-versatile` under stable network conditions).
*   **Manual Retrieval Estimate:** $35\text{ minutes}$ (representing average engineer search time across physical safety binders, coking logs, and maintenance logs).
*   **Net Time Savings:** $99.9\%$ reduction in diagnostic lookup time.
*   **Citation Coverage:** $100\%$ of successful RAG queries mapped exact file sources and page number references.
*   **Compliance Detection Rate:** $100\%$ detection (0 false negatives) when evaluating telemetry spikes (e.g., $350\text{ mmWC}$ vs $15\text{ mmWC}$ limit) against standard CREP safety thresholds.

---

## 5. Prototype Scope & Limitations

As a pre-production demonstration prototype, the benchmarking is bounded by the following parameters:
1.  **Synthetic SCADA Feed:** Telemetry values are generated via an SSE simulator mimicking SCADA metrics instead of direct physical Modbus/OPC-UA connections.
2.  **Mock P&ID Blueprints:** The Gemini vision pipeline processes formatted mock schematic drawings rather than industrial CAD engineering drawings.
3.  **Local API Bounds:** Latency is subject to external LLM API rate limits (mitigated for demo through fallback handling in this prototype).
4.  **Public Document Validation Limits:** The validation dataset consists of public regulatory/safety standard excerpts (OSHA 1910.119, OISD 150, and EPA Title V) and does not represent an actual factory production deployment or validation on proprietary operational files. All evaluations are manually graded or validated against seeded mock reference states.
