from typing import Dict, Any

# Dynamic graph traces and detailed responses for each agent to guarantee
# demo safety if external LLM APIs (Groq/Gemini/Mistral) are rate-limited or offline.
FALLBACK_DATA: Dict[str, Dict[str, Any]] = {
    "rca": {
        "COB-1": {
            "identified_root_cause": "Demo fallback: live AI provider unavailable. Oven #12 fugitive door seal leaks caused by graphite rope compression failure under thermal cycling.",
            "contributing_factors": [
                "Graphite door seal rope compression set exceeded limits.",
                "Thermal expansion differences during carbonization cycles.",
                "Oven door latch mechanical tension drift."
            ],
            "suggested_mitigations": [
                "Perform scheduled replacement of Oven #12 graphite rope seal (WO-7715).",
                "Increase daily inspection frequency for Oven door latches.",
                "Adjust torque parameters on automated pusher car latching guides."
            ],
            "severity_assessment": "High",
            "graph_trace": {
                "affected_nodes": ["COB-1", "GCM-104"],
                "affected_edges": [
                    {"source": "COB-1", "target": "GCM-104", "reason": "Fugitive door gases bypass secondary main collect lines"}
                ],
                "reasoning_steps": [
                    "Identified Oven #12 door leakage alarms in Incident registry",
                    "Traversed topology connection COB-1 -> GCM-104",
                    "Correlated WO-7715 work order history",
                    "Generated door seal failure mitigation plan"
                ],
                "evidence_refs": ["CREP-2026 guidelines", "WO-7715 maintenance logs"]
            }
        },
        "GCM-104": {
            "identified_root_cause": "Demo fallback: live AI provider unavailable. Collector Main gas back-pressure regulator main diaphragm failure, causing a transient pressure spike to 350 mmWC.",
            "contributing_factors": [
                "Frozen proportional controller valve feedback loop on PSV-202.",
                "High hydraulic friction on regulator return spring.",
                "Spike in raw gas volumes during simultaneous charge cycles on COB-1."
            ],
            "suggested_mitigations": [
                "Calibrate pressure control loop PIC-202 immediately.",
                "Inspect diaphragm housing on PSV-202 control valve.",
                "Avoid double-battery parallel charging car sequences."
            ],
            "severity_assessment": "Critical",
            "graph_trace": {
                "affected_nodes": ["GCM-104", "PSV-202", "PIC-202", "PT-202"],
                "affected_edges": [
                    {"source": "PT-202", "target": "GCM-104", "reason": "Measured pressure spike feed"},
                    {"source": "PIC-202", "target": "PSV-202", "reason": "Frozen controller control signal"}
                ],
                "reasoning_steps": [
                    "Retrieved critical back-pressure spike log (350 mmWC)",
                    "Mapped PT-202 transmitter measurements to GCM-104 main",
                    "Identified frozen control loop output at PIC-202",
                    "Traced cascade failure to control valve PSV-202"
                ],
                "evidence_refs": ["OISD safety manuals", "PIC-202 calibration logs"]
            }
        }
    },
    "risk": {
        "COB-1": {
            "calculated_score": 72,
            "risk_level": "High",
            "explanation": "Demo fallback: live AI provider unavailable. High risk driven by active compliance issues (NON_COMPLIANT status due to Oven #12 door emissions under CREP guidelines) and recent incident logs, partially mitigated by graphite rope replacements on WO-7715.",
            "graph_trace": {
                "affected_nodes": ["COB-1", "GCM-104"],
                "affected_edges": [
                    {"source": "COB-1", "target": "GCM-104", "reason": "Cascading flue temperature warnings"}
                ],
                "reasoning_steps": [
                    "Calculated baseline risk of 10",
                    "Added 20 for active Incident (Door Emission Leak)",
                    "Added 25 for compliance state NON_COMPLIANT",
                    "Applied partial mitigation credit for recent work order WO-7715"
                ],
                "evidence_refs": ["CREP compliance records", "Incident timeline"]
            }
        },
        "GCM-104": {
            "calculated_score": 88,
            "risk_level": "Critical",
            "explanation": "Demo fallback: live AI provider unavailable. Critical risk level triggered by major back-pressure control loop failure at PIC-202/PSV-202, active environmental reviews, and neighbor risk propagation from COB-1 door seal leaks.",
            "graph_trace": {
                "affected_nodes": ["GCM-104", "PT-202", "PIC-202", "PSV-202"],
                "affected_edges": [
                    {"source": "PT-202", "target": "GCM-104", "reason": "Spike propagation"},
                    {"source": "PIC-202", "target": "PSV-202", "reason": "Control connection failure"}
                ],
                "reasoning_steps": [
                    "Assessed baseline risk score at 10",
                    "Added 40 for Critical incident (Collector Main Pressure Spike)",
                    "Added 15 for compliance state UNDER_REVIEW",
                    "Added 10 for cascading neighbor risk from COB-1 (72 risk score)",
                    "Added 13 for control loop sensor drifts"
                ],
                "evidence_refs": ["APPCB environmental norms", "PT-202 calibration logs"]
            }
        }
    },
    "compliance": {
        "COB-1": {
            "status": "NON_COMPLIANT",
            "violations": [
                "CREP Environmental Guidelines Section 4: Fugitive emissions on door exceeded 15 seconds limit.",
                "State Pollution Control Board Norms: Unresolved smoke leaks during carbonization."
            ],
            "findings": "Demo fallback: live AI provider unavailable. Oven Battery 1 is currently non-compliant due to persistent graphite door seal wear resulting in fugitive leaks on Oven #12.",
            "graph_trace": {
                "affected_nodes": ["COB-1"],
                "affected_edges": [],
                "reasoning_steps": [
                    "Loaded safety threshold regulations CREP-2026",
                    "Checked daily inspection logs for Oven doors",
                    "Detected seal leakage duration exceeding 15 seconds"
                ],
                "evidence_refs": ["CREP Guidelines Handbook"]
            }
        },
        "GCM-104": {
            "status": "UNDER_REVIEW",
            "violations": [
                "Potential breach of APPCB General Environmental standards during the pressure spike event."
            ],
            "findings": "Demo fallback: live AI provider unavailable. Under review following emergency gas bleed valve bypass pressure warning. Detailed gas chromatography results pending.",
            "graph_trace": {
                "affected_nodes": ["GCM-104", "PT-202"],
                "affected_edges": [
                    {"source": "PT-202", "target": "GCM-104", "reason": "Audit checkpoint"}
                ],
                "reasoning_steps": [
                    "Checked APPCB pressure guidelines",
                    "Identified pressure bypass trigger of 350 mmWC",
                    "Requested official emission audit log"
                ],
                "evidence_refs": ["APPCB regulations"]
            }
        }
    },
    "lessons": {
        "COB-1": {
            "lessons_extracted": [
                "Demo fallback: live AI provider unavailable. Door graphite seal ropes exhibit accelerated degradation when flue temperatures exceed 1150C.",
                "Mechanical latch tensions tend to drift after 120 coking cycles."
            ],
            "preventive_actions": [
                "Implement a bi-weekly preventive inspection checklist for Oven door seals.",
                "Upgrade door rope seals from standard graphite to high-temperature carbon-composite ropes.",
                "Install automated latch tension monitoring sensors on the pusher car guide."
            ],
            "safety_recommendations": [
                "Mandate fire-resistant PPE for all personnel operating on the pusher side of COB-1.",
                "Integrate door emission detection alerts directly into the SCADA interface."
            ],
            "graph_trace": {
                "affected_nodes": ["COB-1", "CP-102"],
                "affected_edges": [
                    {"source": "CP-102", "target": "COB-1", "reason": "Pusher guide alignment maintenance connection"}
                ],
                "reasoning_steps": [
                    "Scanned incident log history for COB-1",
                    "Analyzed corrective maintenance patterns under WO-7715",
                    "Formulated preventative graphite rope upgrades"
                ],
                "evidence_refs": ["Historical failure log books", "WO-7715 logs"]
            }
        },
        "GCM-104": {
            "lessons_extracted": [
                "Demo fallback: live AI provider unavailable. Back-pressure regulation loop failures are frequently preceded by minor signal calibration drift on pressure transmitter PT-202."
            ],
            "preventive_actions": [
                "Perform scheduled weekly loop checks on PIC-202 controller.",
                "Replace transmitter PT-202 diaphragms every 12 months regardless of wear indicators."
            ],
            "safety_recommendations": [
                "Establish hardcoded mechanical relief valve thresholds as secondary backup to digital valve controllers."
            ],
            "graph_trace": {
                "affected_nodes": ["GCM-104", "PT-202", "PIC-202"],
                "affected_edges": [
                    {"source": "PT-202", "target": "GCM-104", "reason": "Failsafe audit"}
                ],
                "reasoning_steps": [
                    "Reviewed pressure spike event root cause findings",
                    "Mapped control loop dependency chart",
                    "Extracted preventative hardware relief recommendations"
                ],
                "evidence_refs": ["PT-202 work orders", "PIC-202 diagram schematics"]
            }
        }
    },
    "knowledge": {
        "COB-1": {
            "answer": "Demo fallback: live AI provider unavailable. Vizag Steel Coke Oven Battery 1 (COB-1) contains 65 carbonization chambers. Normal coking time is 17-20 hours. Visible door emissions must not exceed 5% of doors under CREP guidelines.",
            "confidence": 0.95,
            "related_tags": ["COB-1", "GCM-104"],
            "graph_trace": {
                "affected_nodes": ["COB-1", "GCM-104"],
                "affected_edges": [
                    {"source": "COB-1", "target": "GCM-104", "reason": "Gas flow connection"}
                ],
                "reasoning_steps": [
                    "Read cached backup documentation for COB-1",
                    "Checked RAG passages for Vizag Coke Oven SOP"
                ],
                "evidence_refs": ["vizag_coke_oven_sop.txt"]
            }
        },
        "GCM-104": {
            "answer": "Demo fallback: live AI provider unavailable. Collector main back-pressure regulation loop (PIC-202/PSV-202) regulates gas main pressure between 10 to 15 mmWC. Spikes above 300 mmWC trigger emergency bleed valve safety protocols.",
            "confidence": 0.95,
            "related_tags": ["GCM-104", "PIC-202", "PSV-202"],
            "graph_trace": {
                "affected_nodes": ["GCM-104", "PIC-202", "PSV-202"],
                "affected_edges": [
                    {"source": "PIC-202", "target": "PSV-202", "reason": "Controls pressure loop"}
                ],
                "reasoning_steps": [
                    "Read cached backup pressure loop documentation",
                    "Checked RAG passages for collector main SOP"
                ],
                "evidence_refs": ["vizag_coke_oven_sop.txt"]
            }
        }
    }
}

def get_fallback_response(agent_type: str, tag_number: str, default_fallback: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns custom detailed fallback report matching Vizag Steel tags if present.
    If tag not found, builds a generic fallback structure using default_fallback input.
    """
    cleaned_tag = (tag_number or "").upper().strip()
    agent_fallback = FALLBACK_DATA.get(agent_type, {})
    
    if cleaned_tag in agent_fallback:
        return agent_fallback[cleaned_tag]
        
    # Return generic fallback conform to schema
    return default_fallback
