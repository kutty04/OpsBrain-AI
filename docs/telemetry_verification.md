# OpsBrain AI: SCADA Telemetry Stream Verification Report

This document verifies the implementation, telemetry payload structure, and client-side integration of the synthetic SCADA telemetry stream for **OpsBrain AI** (v1.2).

---

## 1. Telemetry Stream Architecture

To simulate live operations without requiring physical plant machinery connections, the backend exposes a Server-Sent Events (SSE) stream endpoint:

*   **API Endpoint Route:** `GET /api/v1/telemetry/stream`
*   **Wording & Claim Policy:** *"Synthetic SCADA-style telemetry stream for prototype demonstration."*

---

## 2. Sample Event Payloads

The backend stream yields events formatted strictly as EventStream data frames. Below is a validated sample payload transmitted over the connection:

```json
data: {
  "id": "evt-0004",
  "timestamp": "2026-07-03T16:00:00Z",
  "asset_tag": "GCM-104",
  "event_type": "gas_pressure_deviation",
  "severity": "Critical",
  "message": "Gas collector main GCM-104 pressure spiked to 342.5 mmWC (limit: 15 mmWC)",
  "value": 342.5,
  "unit": "mmWC",
  "source": "synthetic_telemetry",
  "related_nodes": ["COB-1", "PSV-202", "PT-202"]
}
```

### Event Parameter Types:
*   `event_type`: Categorized by telemetry anomalies (e.g. `temperature_spike`, `gas_pressure_deviation`, `compliance_warning`, `maintenance_risk_signal`).
*   `related_nodes`: Maps cascading nodes within the graph neighborhood for dynamic visual highlights.

---

## 3. Frontend Client Integration

Inside `frontend/src/App.jsx`, the frontend implements an `EventSource` connection listener:

1.  **Toggle Trigger:** Toggling the **"Live Alarms"** presentation widget to `SIMULATING` instantiates a new native `EventSource('http://127.0.0.1:8000/api/v1/telemetry/stream')` connection.
2.  **Live Updates:** Each event parsed from the stream shifts a new alert card into the Alert Center, fluctuates the plant-wide risk average, and updates risk levels for the affected tag.
3.  **Connection Monitor Status:** The AI Runtime Monitor modal displays `CONNECTED` while the stream is open.
4.  **Graceful Fallback:** If the connection drops or fails to connect, the `onerror` callback traps the exception, switches the monitor status to `FALLBACK_LOCAL`, and automatically runs a local interval simulation to ensure presentation safety.

---

## 4. Prototype Verification Scope & Limitations

*   **No Real SCADA Hardware Connection:** This stream is generated synthetically by the backend process to showcase real-time interface reactions. It is not connected to a live OPC-UA or Modbus factory server.
*   **Local Network Binding:** By default, it binds to `localhost:8000`. Cross-origin resource sharing (CORS) rules are configured specifically to allow local frontend origins.
