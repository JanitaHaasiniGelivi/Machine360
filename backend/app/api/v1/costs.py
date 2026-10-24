"""Maintenance Cost & Economic Impact Simulator
Calculates preventive vs reactive maintenance expenditure, downtime losses, and net ROI.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.entities import CostScenario
from app.schemas.schemas import CostSimulateRequest, CostSimulateResponse

router = APIRouter(prefix="", tags=["Cost Simulator"])


def calculate_scenario_costs(data: CostSimulateRequest) -> Dict[str, Any]:
    # Formulas:
    # Preventive Maintenance (Planned Intervention):
    # - Standard Inspection + Labor + Planned Spare part
    # - Downtime is minimal/planned (e.g. 1.5 hours planned vs full unplanned shutdown)
    planned_downtime_hours = max(1.0, data.downtime_hours * 0.20)
    planned_downtime_cost = planned_downtime_hours * data.downtime_cost_per_hour
    preventive_total = round(
        data.inspection_cost + data.labor_cost + data.spare_part_cost + planned_downtime_cost, 2
    )

    # Reactive Maintenance (Catastrophic Failure in Production):
    # - Emergency Repair surcharge (1.75x) + Emergency spare part expediting (1.5x)
    # - Emergency overtime labor (2.0x) + Full unplanned downtime loss
    reactive_repair = data.repair_cost * 1.75
    reactive_parts = data.spare_part_cost * 1.50
    reactive_labor = data.labor_cost * 2.0
    unplanned_downtime_cost = data.downtime_hours * data.downtime_cost_per_hour

    reactive_total = round(
        data.inspection_cost + reactive_repair + reactive_parts + reactive_labor + unplanned_downtime_cost, 2
    )

    net_savings = round(reactive_total - preventive_total, 2)
    roi_percent = round((net_savings / preventive_total * 100.0), 1) if preventive_total > 0 else 0.0

    return {
        "preventive_total": preventive_total,
        "reactive_total": reactive_total,
        "net_savings": net_savings,
        "roi_percent": roi_percent,
        "breakdown": {
            "planned_downtime_hours": planned_downtime_hours,
            "planned_downtime_cost": round(planned_downtime_cost, 2),
            "emergency_repair_cost": round(reactive_repair, 2),
            "emergency_parts_cost": round(reactive_parts, 2),
            "emergency_labor_cost": round(reactive_labor, 2),
            "unplanned_downtime_cost": round(unplanned_downtime_cost, 2),
        },
    }


@router.post("/costs/simulate", response_model=CostSimulateResponse)
def simulate_cost(data: CostSimulateRequest, db: Session = Depends(get_db)):
    calc = calculate_scenario_costs(data)

    # Save scenario
    scenario = CostScenario(
        name=data.name,
        inspection_cost=data.inspection_cost,
        repair_cost=data.repair_cost,
        spare_part_cost=data.spare_part_cost,
        labor_cost=data.labor_cost,
        downtime_hours=data.downtime_hours,
        downtime_cost_per_hour=data.downtime_cost_per_hour,
        total_preventive_cost=calc["preventive_total"],
        total_reactive_cost=calc["reactive_total"],
        net_savings=calc["net_savings"],
    )
    db.add(scenario)
    db.commit()

    formula = (
        "Preventive Cost = Inspection + Planned Labor + Spare Part + (Planned Downtime 20% × Hourly Cost)\n"
        "Reactive Cost = Inspection + (Emergency Repair × 1.75) + (Emergency Parts × 1.5) + (Overtime Labor × 2) + (Unplanned Downtime × Hourly Cost)\n"
        "Net Savings = Reactive Cost - Preventive Cost"
    )

    return CostSimulateResponse(
        scenario_name=data.name,
        preventive_total_cost=calc["preventive_total"],
        reactive_total_cost=calc["reactive_total"],
        net_savings=calc["net_savings"],
        roi_percent=calc["roi_percent"],
        cost_breakdown=calc["breakdown"],
        formula_summary=formula,
    )


@router.post("/scenarios/compare")
def compare_scenarios(scenarios: List[CostSimulateRequest]):
    results = []
    for s in scenarios:
        calc = calculate_scenario_costs(s)
        results.append(
            {
                "name": s.name,
                "preventive_total": calc["preventive_total"],
                "reactive_total": calc["reactive_total"],
                "net_savings": calc["net_savings"],
                "roi_percent": calc["roi_percent"],
                "downtime_hours": s.downtime_hours,
                "downtime_cost_per_hour": s.downtime_cost_per_hour,
            }
        )
    return {"scenarios": results}
