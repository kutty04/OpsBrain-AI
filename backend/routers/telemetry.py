import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
import random
import datetime as dt

router = APIRouter(prefix="/telemetry", tags=["Telemetry Stream"])

@router.get("/stream")
async def telemetry_stream():
    """
    Server-Sent Events (SSE) endpoint streaming realistic synthetic industrial telemetry
    events for Vizag Steel Coke Oven Battery asset components.
    """
    async def event_generator():
        assets = ["COB-1", "GCM-104", "CC-101", "CP-102", "PSV-202", "HE-301", "PT-202", "PIC-202"]
        event_types = [
            ("temperature_spike", "High", "Temperature spike detected: flue temperature operating at {val}C", "C", (1100, 1200)),
            ("gas_pressure_deviation", "Critical", "Gas collector main GCM-104 pressure spiked to {val} mmWC (limit: 15 mmWC)", "mmWC", (300, 360)),
            ("compliance_warning", "High", "Fugitive door emission duration of {val}s exceeded CREP safety limit", "s", (16, 25)),
            ("maintenance_risk_signal", "Medium", "Technician reported actuator feed drift of {val}% on valve controller", "%", (5, 12)),
            ("sensor_normal_reading", "Low", "Liquor Heat Exchanger temperature stabilized at {val}C", "C", (35, 45)),
            ("graph_neighbor_risk_propagation", "High", "Cascading thermal load from COB-1 door seal leak detected on GCM-104", "C", (1080, 1120)),
            ("document_inspection_reminder", "Low", "Scheduled visual door audit check (CREP section {val}) due in 2 hours", "section", (3, 5))
        ]
        
        event_id = 0
        while True:
            # Yield event every 8 seconds
            await asyncio.sleep(8)
            
            event_id += 1
            asset = random.choice(assets)
            ev_name, severity, msg_tmpl, unit, val_range = random.choice(event_types)
            val = round(random.uniform(*val_range), 1)
            msg = msg_tmpl.format(val=val)
            
            related = []
            if asset == "COB-1":
                related = ["GCM-104", "CC-101", "CP-102"]
            elif asset == "GCM-104":
                related = ["COB-1", "PSV-202", "PT-202"]
            elif asset == "PIC-202":
                related = ["PSV-202", "PT-202"]
            
            payload = {
                "id": f"evt-{event_id:04d}",
                "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
                "asset_tag": asset,
                "event_type": ev_name,
                "severity": severity,
                "message": msg,
                "value": val,
                "unit": unit,
                "source": "synthetic_telemetry",
                "related_nodes": related
            }
            
            yield f"data: {json.dumps(payload)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
