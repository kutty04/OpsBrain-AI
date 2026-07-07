# OpsBrain AI: Domain Benchmark Question Set
> **Release Candidate v1.2 — Validation Suite**

This document records the official domain benchmark question set used to evaluate the accuracy, compliance auditing, and graph topology traversal performance of **OpsBrain AI** under the ET AI Hackathon 2026 Problem Statement #8 scope.

---

## 📊 Summary of Benchmark Suite

*   **Total Questions:** 15
*   **Evaluation Categories:**
    *   **RAG / Document Lookup:** 5 questions
    *   **Compliance Auditing:** 5 questions
    *   **Graph Relationships:** 4 questions
    *   **Root Cause Analysis (RCA):** 1 question
*   **Scope Distribution:**
    *   **Seeded Vizag Steel Scenario:** 5 questions
    *   **Public Industrial Validation Excerpts:** 5 questions
    *   **Cross-Dataset Scope (Both):** 5 questions

---

## 📝 Complete Question Catalog

### 1. Document Lookup & RAG
*   **BQ-001:** *What is the normal operating back-pressure range for the raw gas collector main GCM-104?*
    *   **Expected Summary:** 10 to 15 mmWC (water column) regulated by the pressure regulating control valve PSV-202.
    *   **Dataset Scope:** Both (Seeded Vizag + OISD 150)
    *   **Grading Method:** Automated
*   **BQ-011:** *Under OSHA 1910.119, how frequently must process operating procedures be certified?*
    *   **Expected Summary:** Employers must review and certify annually that operating procedures are current and accurate.
    *   **Dataset Scope:** Public Validation Excerpt (OSHA 1910.119)
    *   **Grading Method:** Automated
*   **BQ-014:** *What is the normal expected carbonization cycle time for Coke Oven Battery 1?*
    *   **Expected Summary:** 17 to 20 hours for complete carbonization.
    *   **Dataset Scope:** Seeded Vizag (vizag_coke_oven_sop.txt)
    *   **Grading Method:** Automated
*   **BQ-009:** *What does OSHA 1910.119 mandate regarding emergency shutdown operating procedures?*
    *   **Expected Summary:** Operating procedures must detail emergency shutdown conditions and designate qualified operators to execute the shutdown in a safe and timely manner.
    *   **Dataset Scope:** Public Validation Excerpt (OSHA 1910.119)
    *   **Grading Method:** Manual
*   **BQ-015:** *What records must be kept and for how long under EPA Title V regulations for coke ovens?*
    *   **Expected Summary:** Records of daily observations, door leak detections, lid adjustments, and corresponding work orders must be preserved for a minimum of 5 years.
    *   **Dataset Scope:** Public Validation Excerpt (EPA Clean Air Act Title V)
    *   **Grading Method:** Automated

---

### 2. Compliance Auditing
*   **BQ-003:** *Is Coke Oven Battery 1 (COB-1) currently compliant with safety emission standards?*
    *   **Expected Summary:** NON_COMPLIANT due to visible door emissions exceeding the allowed duration of 15 seconds on Oven #12.
    *   **Dataset Scope:** Both (Seeded Vizag + EPA Title V)
    *   **Grading Method:** Automated
*   **BQ-007:** *What is the emergency protocol under OISD 150 standard if the gas collecting main pressure spikes above 300 mmWC?*
    *   **Expected Summary:** The emergency bleed valve (bypass valve) must automatically open to vent raw coke oven gas to the atmosphere.
    *   **Dataset Scope:** Public Validation Excerpt (OISD 150)
    *   **Grading Method:** Automated
*   **BQ-010:** *What is the maximum allowed leakage limit percentage for coke oven lids under EPA Title V regulations?*
    *   **Expected Summary:** Visible leaks from charging hole lids are restricted to not exceed 1.0% of the total lids on the battery.
    *   **Dataset Scope:** Both (Seeded Vizag + EPA Title V)
    *   **Grading Method:** Automated
*   **BQ-012:** *What are the consequences of a low-pressure deviation (< 5 mmWC) in the gas collecting main?*
    *   **Expected Summary:** Risk of pressure dropping below atmospheric, resulting in air ingress and internal explosion hazard.
    *   **Dataset Scope:** Public Validation Excerpt (OISD 150)
    *   **Grading Method:** Automated

---

### 3. Graph Topology Relationships
*   **BQ-005:** *Explain the physical relationship and flow path between coal charging and raw gas extraction.*
    *   **Expected Summary:** Coal Charging Car CC-101 charges coal into Coke Oven Battery COB-1, which generates raw gas flowing to Gas Collecting Main GCM-104.
    *   **Dataset Scope:** Seeded Vizag
    *   **Grading Method:** Manual
*   **BQ-008:** *How does the pressure controller PIC-202 interact with the physical valve PSV-202?*
    *   **Expected Summary:** PIC-202 controls the opening position of PSV-202 based on pressure transmitter PT-202 measurements.
    *   **Dataset Scope:** Seeded Vizag
    *   **Grading Method:** Automated
*   **BQ-013:** *Identify which assets are directly affected by the Coal Charging Car (CC-101) charging operations.*
    *   **Expected Summary:** CC-101 charges coal directly into Coke Oven Battery COB-1, affecting raw gas generation in GCM-104.
    *   **Dataset Scope:** Seeded Vizag
    *   **Grading Method:** Automated

---

### 4. Incident Analysis & Root Cause (RCA)
*   **BQ-002:** *Identify the root cause of the pressure spike on collector main GCM-104.*
    *   **Expected Summary:** Proportional controller (PIC-202) output froze, preventing the regulating valve PSV-202 from opening.
    *   **Dataset Scope:** Seeded Vizag
    *   **Grading Method:** Automated
*   **BQ-004:** *What maintenance work order was executed to address door emission leaks on COB-1?*
    *   **Expected Summary:** Work Order WO-7715 was executed to replace worn graphite door seal ropes on Oven #12 and #13.
    *   **Dataset Scope:** Seeded Vizag
    *   **Grading Method:** Automated
*   **BQ-006:** *What are the lessons learned and preventative recommendations for graphite rope door seal deterioration?*
    *   **Expected Summary:** Graphite rope seals suffer from compression loss under thermal cycling; they must be inspected every 30 operating cycles and replaced immediately if worn.
    *   **Dataset Scope:** Both (Seeded Vizag + OISD 150)
    *   **Grading Method:** Automated

---

## 🎛️ Evaluation & Grading Guidelines
1.  **Automated Checks:** Queries are sent to the Knowledge Copilot / agents. Responses are verified against Pydantic models matching required nodes (`expected_asset_tags`) and keyword validation of `expected_answer_summary`.
2.  **Manual Verification:** Complex structural or logical questions (such as BQ-005 and BQ-009) are audited manually by the operator to verify that the generated RAG explanation remains grounded and free of hallucination.
