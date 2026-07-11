# Phase 6B Browser Smoke Proof Pack

**Branch:** `phase-6-experimental`  
**Commit:** `98fdff41458334a761f7aa9dc55784859cd7206d` (Phase 6B minimal UI button + state indicator)  
**Date:** 2026-07-11  
**Verdict:** PHASE 6B FULLY BROWSER-SAFE

---

## UI Additions: Minimal Refinery Access

### Summary of Changes
- **Active Dataset State:** Added `activeDataset` state to track the active dataset (`vizag` vs `refinery`).
- **Seeding Guard:** Added `seedingDataset` guard state to disable both seed buttons during active database seeding, preventing concurrent overlapping requests.
- **Active Dataset Label:** Added a small metadata text indicator in the sidebar showing the active dataset name.
- **Seed Refinery Button:** Added a "Seed Refinery Demo" button in the sidebar (styled in amber/neutral to distinguish it from the primary Vizag steel blue action).
- **Scalability Note:** Added a minor informational note beneath the seed buttons to clarify that the Refinery Pump Station is an optional scalability demo.
- **Investigation Resets:** Modified seed handlers for both Vizag and Refinery to automatically clear any in-flight agent loading states (`rcaLoading`, `riskAgentLoading`, `complianceAgentLoading`, `lessonsLoading`) and investigation states (`isInvestigating`, `investigationStep`, `investigationLogs`) to avoid blocking the Action Bar.

**File changed:** `frontend/src/App.jsx` — 74 insertions, 7 deletions

---

## Browser Smoke Test (v6) Sequence Results

A comprehensive 16-point browser integration test was run to verify the entire dataset-switching flow and ensure zero regressions on the default Vizag flow:

| # | Check | Result | Details |
|---|-------|--------|---------|
| 1 | App loads | ✅ | Initial load is clean |
| 2 | Seed Vizag works | ✅ | Reset database and seeded Vizag dataset |
| 3 | Active Dataset Label after Vizag seed | ✅ | Displays: `VIZAG STEEL COKE OVEN` |
| 4 | Digital Twin tab opens & COB-1 selected | ✅ | COB-1 clicked, ReactFlow graph renders 50 elements |
| 5 | Run RCA / Run Risk on Vizag | ✅ | RCA & Risk agents executed successfully |
| 6 | Copilot retrieval works | ✅ | Queried: "What field note exists for PSV-202 during monsoon?" — citation found |
| 7 | Seed Refinery Demo works | ✅ | Switched database, Label changes to: `REFINERY PUMP STATION` |
| 8 | Asset Register displays refinery tags | ✅ | Registers: `RPS-1`, `P-101`, `PT-301`, `TK-501`, `M-101`, `VLV-201` |
| 9 | Select P-101 in Digital Twin | ✅ | P-101 clicked, ReactFlow graph renders 71 elements |
| 10 | Re-seed Vizag works | ✅ | Restored Vizag dataset, Label updates to: `VIZAG STEEL COKE OVEN` |
| 11 | COB-1 back in register | ✅ | COB-1 visible and clickable, Graph Topology verified |
| 12 | No refinery leak check | ✅ | API `/assets` query returns only Vizag assets |
| 13 | Run RCA regression check | ✅ | RCA agent runs successfully on restored Vizag data |
| 14 | P&ID Parser workspace opens | ✅ | Workspace loads correctly |
| 15 | Document Ingestion workspace opens | ✅ | Workspace loads correctly |
| 16 | Console & Network hygiene | ✅ | **0 SEVERE console errors** and **0 duplicate network requests** |

---

## Screenshots captured

All screenshots are stored in the artifact storage directory and illustrate key points in the dataset-switching lifecycle:

| File | Description |
|------|-------------|
| `6B_01_initial.png` | App initial load |
| `6B_02_vizag_seeded.png` | Active Dataset label set to Vizag Steel after seed |
| `6B_03_twin_cob1.png` | Vizag COB-1 Digital Twin & ReactFlow view |
| `6B_04_rca.png` | RCA agent response |
| `6B_05_risk.png` | Risk agent response |
| `6B_08_copilot_psv202.png` | Copilot response displaying PSV-202 monsoon field note citation |
| `6B_09_refinery_seeded.png` | Refinery dataset active, label updated |
| `6B_10_refinery_asset_register.png` | Refinery asset register list (RPS-1, P-101, etc.) |
| `6B_11_p101_selected.png` | Refinery P-101 selected, 71 ReactFlow graph elements |
| `6B_12_vizag_reseeded.png` | Vizag restored, active dataset label reset |
| `6B_13_cob1_after_reseed.png` | Vizag COB-1 restored successfully in asset register |
| `6B_15_pid_parser.png` | P&ID Parser workspace state |
| `6B_16_document_ingestion.png` | Ingestion workspace state |
| `6B_17_final_state.png` | Final application state |

---

## Safe Fallback Branches & Tags

| Ref | Status |
|-----|--------|
| `phase-upgrades-v2` | ✅ Stable baseline for Phase 5B (untouched) |
| `phase-5B-browser-safe` | ✅ Git tag for Phase 5B baseline (untouched) |
| `phase-6A-backend-safe` | ✅ Git tag for Phase 6A backend proof (untouched) |
| `phase-6-experimental` | Active experimental branch |
