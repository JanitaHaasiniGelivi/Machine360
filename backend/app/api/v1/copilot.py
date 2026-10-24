"""MachineMind 360 AI Maintenance Copilot
Deterministic, domain-aware industrial assistant specialized in AI4I 2020 predictive maintenance,
physics-based reasoning, fault taxonomy, and technician troubleshooting guidance.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter
from app.schemas.schemas import CopilotChatRequest, CopilotChatResponse

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

KNOWLEDGE_BASE = {
    "twf": (
        "**Tool Wear Failure (TWF):** Occurs when cumulative tool cutting time exceeds the safe wear limit "
        "(typically between 200 and 240 minutes). In machining, abrasive and adhesive wear on the cutting "
        "inserts increases cutting friction, inducing micro-fractures, dimensional tolerance loss, and catastrophic blade breakage."
    ),
    "hdf": (
        "**Heat Dissipation Failure (HDF):** Occurs when the difference between Process Temperature and Air Temperature "
        "drops below 8.6 K while rotational spindle speed is under 1,380 RPM. The lower speed limits convective cooling "
        "from spindle fanning while high torque or inadequate coolant circulation leads to localized thermal lockup."
    ),
    "pwf": (
        "**Power Failure (PWF):** Mechanical spindle power is determined by the formula: `Power = Torque [Nm] × 2π × RPM / 60`. "
        "If power drops below 3,500 Watts or surges above 9,000 Watts, the spindle motor operates outside its rated electrical "
        "and mechanical stability envelope, tripping thermal overloads or causing drive motor stall."
    ),
    "osf": (
        "**Overstrain Failure (OSF):** Triggered when the product of Tool Wear and Applied Torque exceeds safe threshold "
        "limits (11,000 min·Nm for product Type L, 12,000 for Type M, 13,000 for Type H). Heavy cutting torque applied "
        "to a worn tool blade creates excessive shear stress, snapping the tool holder."
    ),
    "rnf": (
        "**Random Failure (RNF):** An uncorrelated stochastic fault that occurs with a constant probability of ~0.1% "
        "independent of current operating variables. Typical root causes include sudden electrical transients, raw material "
        "metallurgical inclusions, or foreign debris."
    ),
}


def analyze_user_query(
    message: str,
    readings: Optional[Dict[str, Any]] = None,
    pred: Optional[Dict[str, Any]] = None,
) -> CopilotChatResponse:
    query = message.lower()
    checklist: List[str] = []
    insights: List[str] = []
    actions: List[str] = []

    # Check for specific fault code explanations
    fault_matched = False
    for code, text in KNOWLEDGE_BASE.items():
        if code in query:
            insights.append(text)
            fault_matched = True

    # If asking about current readings or prediction
    if readings or pred:
        rpm = readings.get("rotational_speed_rpm") or (pred.get("input_readings", {}).get("rotational_speed_rpm") if pred else None)
        torque = readings.get("torque_nm") or (pred.get("input_readings", {}).get("torque_nm") if pred else None)
        tool_wear = readings.get("tool_wear_min") or (pred.get("input_readings", {}).get("tool_wear_min") if pred else None)
        air_temp = readings.get("air_temperature_k") or (pred.get("input_readings", {}).get("air_temperature_k") if pred else None)
        proc_temp = readings.get("process_temperature_k") or (pred.get("input_readings", {}).get("process_temperature_k") if pred else None)
        
        # Physics calculations if variables exist
        if rpm and torque:
            power = round((torque * 2 * 3.14159265 * rpm) / 60, 1)
            insights.append(f"Derived Mechanical Spindle Power: **{power:,} Watts** (Safe operating window: 3,500 W – 9,000 W).")
            if power < 3500:
                insights.append("Power is below 3,500 W: Motor may be undervolted or experiencing drive slippage.")
                actions.append("Measure motor input voltage and inspect drive belt tension.")
            elif power > 9000:
                insights.append("Power exceeds 9,000 W: Spindle is overloaded! Immediate risk of Power Failure (PWF).")
                actions.append("Reduce feed rate, decrease cutting depth, and check spindle bearing play.")

        if air_temp and proc_temp:
            delta = round(proc_temp - air_temp, 2)
            insights.append(f"Process-Air Temperature Delta (ΔT): **{delta} K** (Critical threshold: 8.6 K at low RPM).")
            if delta < 8.6 and rpm and rpm < 1380:
                insights.append("Critical HDF Condition: ΔT < 8.6 K with Spindle RPM < 1,380. Severe risk of Heat Dissipation Failure.")
                actions.append("Activate external coolant chillers and flush thermal heat exchangers.")

        if tool_wear:
            insights.append(f"Cumulative Tool Wear: **{tool_wear} minutes**.")
            if tool_wear >= 200:
                actions.append("Replace cutting tool insert immediately before next machining cycle (TWF risk).")
            elif tool_wear >= 150:
                actions.append("Schedule cutter head replacement at the next maintenance shift window.")

        if pred:
            prob = pred.get("failure_probability", 0.0)
            risk = pred.get("risk_level", "LOW")
            insights.append(f"Model Diagnostic: Probability of Failure is **{prob * 100:.1f}%** ({risk} risk).")

    # Generate reply message
    if "checklist" in query or "inspection" in query or "inspect" in query:
        reply = (
            "Here is the customized technician inspection checklist based on industrial operating standards "
            "and AI4I 2020 predictive maintenance rules:"
        )
        checklist.extend([
            "Verify spindle lubrication level and oil delivery pressure (target 2.5–3.2 bar).",
            "Perform runout measurement on the spindle arbor with a dial test indicator.",
            "Inspect cutter inserts for flank wear (VB > 0.3mm requires replacement).",
            "Check coolant concentration with refractometer (recommended 7%–9% emulsion).",
            "Verify that thermal sensors on spindle housing and ambient intake read within ±0.5 K tolerance.",
            "Audit motor inverter load logs for current spikes or transient voltage drops.",
        ])
    elif fault_matched:
        reply = (
            "Here is the engineering breakdown for the requested failure modes based on industrial physical mechanisms:"
        )
    elif "hello" in query or "hi" in query or "help" in query:
        reply = (
            "Hello! I am your MachineMind 360 AI Maintenance Copilot. I analyze real machine operating parameters, "
            "explain ML prediction scores, diagnose the 5 standard industrial failure modes (TWF, HDF, PWF, OSF, RNF), "
            "and generate step-by-step technician inspection checklists."
        )
        actions.extend([
            "Ask: 'Explain HDF failure mode'",
            "Ask: 'Generate inspection checklist for machine MAC-001'",
            "Ask: 'Analyze current temperature and power readings'",
        ])
    else:
        reply = (
            "Based on the factory telemetry and machine parameters, I've evaluated your query against physical "
            "operational tolerances and ML classification rules."
        )

    if not actions:
        actions.append("Review telemetry readings against baseline operational specifications.")
        actions.append("Ensure maintenance records and parts inventories are kept up to date.")

    return CopilotChatResponse(
        reply=reply,
        checklist=checklist,
        technical_insights=insights,
        recommended_actions=actions,
    )


@router.post("/chat", response_model=CopilotChatResponse)
def copilot_chat(request: CopilotChatRequest):
    return analyze_user_query(
        message=request.message,
        readings=request.current_readings,
        pred=request.recent_prediction,
    )
