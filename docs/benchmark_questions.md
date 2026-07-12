# OpsBrain AI: Benchmark Question Catalog

[PROTOTYPE BENCHMARK SET - NOT A SUBSTITUTE FOR CERTIFIED COMPLIANCE REVIEW]

This document catalogs the 15 hand-built benchmark questions used to validate the accuracy, graph containment, RAG retrieval, and compliance analysis of the OpsBrain AI engine. All documents referenced are prototype public validation samples and paraphrased safety excerpts.

---

## Benchmark Question Catalog

### BQ-001: Pressure Limits Lookup
*   **Category:** Document lookup
*   **Difficulty:** Easy
*   **Question:** What is the normal pressure range for GCM-104?
*   **Expected Answer Summary:** 10 mmWC to 15 mmWC.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Asset:** `GCM-104`

### BQ-002: Gas Flow Connection
*   **Category:** Asset relationship
*   **Difficulty:** Easy
*   **Question:** How does COB-1 connect to GCM-104 in the knowledge graph?
*   **Expected Answer Summary:** COB-1 feeds gas into GCM-104.
*   **Expected Source:** Graph topology edges
*   **Target Assets:** `COB-1`, `GCM-104`

### BQ-003: Pressure Instability Diagnostic
*   **Category:** RCA reasoning
*   **Difficulty:** Medium
*   **Question:** What should be checked if GCM-104 pressure is unstable?
*   **Expected Answer Summary:** Door seals, safety relief valve PSV-202 status, and general gas piping structural integrity.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Assets:** `GCM-104`, `PSV-202`

### BQ-004: Emission Duration Limit
*   **Category:** Compliance threshold
*   **Difficulty:** Medium
*   **Question:** What compliance issue is triggered by prolonged smoke emission?
*   **Expected Answer Summary:** Cumulative visible smoke must not exceed 3 minutes in any 2-hour window.
*   **Expected Source:** `environmental_emissions_excerpt.txt`
*   **Target Assets:** `COB-1`, `STACK-1`

### BQ-005: Pressure Release Pre-Restart
*   **Category:** Maintenance action
*   **Difficulty:** Hard
*   **Question:** Which maintenance action should be recommended before restarting after a high-pressure event?
*   **Expected Answer Summary:** Perform a physical inspection of safety valve PSV-202 and recalibrate GCM-104 pressure sensors.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Assets:** `PSV-202`, `GCM-104`

### BQ-006: Relief Protection Asset
*   **Category:** Safety procedure
*   **Difficulty:** Easy
*   **Question:** Which asset protects against overpressure?
*   **Expected Answer Summary:** Safety valve PSV-202.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Asset:** `PSV-202`

### BQ-007: Citation Provenance Check
*   **Category:** Evidence/citation behavior
*   **Difficulty:** Medium
*   **Question:** What evidence should the Copilot cite when explaining a pressure deviation?
*   **Expected Answer Summary:** Specific sections of the OISD safety manual (`oisd_coke_oven_safety_excerpt.txt`) and active sensor readings.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Asset:** `GCM-104`

### BQ-008: Finding vs Gap
*   **Category:** Field technician style query
*   **Difficulty:** Hard
*   **Question:** What is the difference between a maintenance finding and a compliance gap?
*   **Expected Answer Summary:** A finding represents physical wear/defect, while a gap is a structural process standard violation (e.g. overdue test).
*   **Expected Source:** `osha_process_safety_excerpt.txt`
*   **Target Asset:** `CC-101`

### BQ-009: Incident Investigation Timeline
*   **Category:** Document lookup
*   **Difficulty:** Easy
*   **Question:** How quickly must an incident investigation be initiated after a torque limit spike on CC-101 according to OSHA guidelines?
*   **Expected Answer Summary:** Within 48 hours.
*   **Expected Source:** `osha_process_safety_excerpt.txt`
*   **Target Asset:** `CC-101`

### BQ-010: Battery Feed Relationship
*   **Category:** Asset relationship
*   **Difficulty:** Easy
*   **Question:** Which asset feeds coal to Coke Oven Battery #1 (COB-1)?
*   **Expected Answer Summary:** Coal Charging Car (CC-101) feeds coal blends directly into COB-1.
*   **Expected Source:** Graph topology edges
*   **Target Assets:** `CC-101`, `COB-1`

### BQ-011: Charging Car Mechanical Spike
*   **Category:** RCA reasoning
*   **Difficulty:** Medium
*   **Question:** What are the common root causes of a torque limit spike on the Coal Charging Car CC-101?
*   **Expected Answer Summary:** Gearbox lubrication failures, bearing wear, mechanical binding, or incorrect PID gains.
*   **Expected Source:** `osha_process_safety_excerpt.txt`
*   **Target Asset:** `CC-101`

### BQ-012: Gas Main Warning Limit
*   **Category:** Compliance threshold
*   **Difficulty:** Medium
*   **Question:** What is the pressure limit warning threshold for the Gas Collector Main GCM-104?
*   **Expected Answer Summary:** Pressure deviations exceeding 25 mmWC.
*   **Expected Source:** `oisd_coke_oven_safety_excerpt.txt`
*   **Target Asset:** `GCM-104`

### BQ-013: Integrity Audit Schedule
*   **Category:** Maintenance action
*   **Difficulty:** Easy
*   **Question:** How often must equipment mechanical integrity audits be performed under OSHA process safety guidelines?
*   **Expected Answer Summary:** Annually.
*   **Expected Source:** `osha_process_safety_excerpt.txt`
*   **Target Assets:** `CC-101`, `CP-102`

### BQ-014: Environmental Cumulative Emission Limit
*   **Category:** Safety procedure
*   **Difficulty:** Medium
*   **Question:** What is the cumulative daily limit of visible smoke emissions before causing non-compliance?
*   **Expected Answer Summary:** 15 minutes per day.
*   **Expected Source:** `environmental_emissions_excerpt.txt`
*   **Target Assets:** `COB-1`, `STACK-1`

### BQ-015: Safety Isolation Search
*   **Category:** Field technician style query
*   **Difficulty:** Hard
*   **Question:** What safety valves are installed on Coke Oven Battery #1?
*   **Expected Answer Summary:** Safety valve PSV-202 (protects GCM-104 connected to COB-1).
*   **Expected Source:** Graph topology edges
*   **Target Assets:** `COB-1`, `PSV-202`
