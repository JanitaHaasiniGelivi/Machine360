"""Maintenance Work Orders and Ticketing API
Provides ticket lifecycle management, status workflows, technician assignment, and audit trails.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_optional
from app.models.entities import (
    MaintenanceTicket,
    MaintenanceAction,
    FactoryAsset,
    AuditEvent,
    User,
)
from app.schemas.schemas import (
    TicketCreate,
    TicketResponse,
    TicketUpdate,
    MaintenanceActionCreate,
    MaintenanceActionResponse,
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance Management"])


def generate_ticket_number(db: Session) -> str:
    count = db.query(MaintenanceTicket).count() + 1001
    return f"TCK-{count}"


@router.get("/tickets", response_model=List[TicketResponse])
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    asset_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(MaintenanceTicket)
    if status_filter:
        query = query.filter(MaintenanceTicket.status == status_filter)
    if priority:
        query = query.filter(MaintenanceTicket.priority == priority)
    if asset_id:
        query = query.filter(MaintenanceTicket.asset_id == asset_id)
    if search:
        search_like = f"%{search}%"
        query = query.filter(
            (MaintenanceTicket.ticket_number.ilike(search_like))
            | (MaintenanceTicket.issue_summary.ilike(search_like))
            | (MaintenanceTicket.assigned_technician.ilike(search_like))
        )

    tickets = query.order_by(MaintenanceTicket.id.desc()).all()
    # Enrich asset_name
    results = []
    for t in tickets:
        asset_name = t.asset.name if t.asset else f"Asset #{t.asset_id}"
        results.append(
            TicketResponse(
                id=t.id,
                ticket_number=t.ticket_number,
                asset_id=t.asset_id,
                asset_name=asset_name,
                prediction_id=t.prediction_id,
                issue_summary=t.issue_summary,
                priority=t.priority,
                status=t.status,
                assigned_technician=t.assigned_technician,
                due_date=t.due_date,
                resolution_notes=t.resolution_notes,
                actions_taken=t.actions_taken,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )
    return results


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    asset = db.query(FactoryAsset).filter(FactoryAsset.id == ticket_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Factory Asset with ID {ticket_in.asset_id} does not exist.",
        )

    tck_num = generate_ticket_number(db)
    ticket = MaintenanceTicket(
        ticket_number=tck_num,
        asset_id=ticket_in.asset_id,
        prediction_id=ticket_in.prediction_id,
        issue_summary=ticket_in.issue_summary,
        priority=ticket_in.priority,
        status="Open",
        assigned_technician=ticket_in.assigned_technician,
        due_date=ticket_in.due_date,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Initial action
    act = MaintenanceAction(
        ticket_id=ticket.id,
        action_description=f"Ticket opened: {ticket.issue_summary}",
        performed_by=current_user.full_name if current_user else "System / Operator",
    )
    db.add(act)

    audit = AuditEvent(
        action="CREATE_TICKET",
        entity_type="MaintenanceTicket",
        entity_id=ticket.ticket_number,
        user_email=current_user.email if current_user else "anonymous",
        details={"asset_id": ticket.asset_id, "priority": ticket.priority},
    )
    db.add(audit)
    db.commit()

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        asset_id=ticket.asset_id,
        asset_name=asset.name,
        prediction_id=ticket.prediction_id,
        issue_summary=ticket.issue_summary,
        priority=ticket.priority,
        status=ticket.status,
        assigned_technician=ticket.assigned_technician,
        due_date=ticket.due_date,
        resolution_notes=ticket.resolution_notes,
        actions_taken=ticket.actions_taken,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )
    return TicketResponse(
        id=t.id,
        ticket_number=t.ticket_number,
        asset_id=t.asset_id,
        asset_name=t.asset.name if t.asset else None,
        prediction_id=t.prediction_id,
        issue_summary=t.issue_summary,
        priority=t.priority,
        status=t.status,
        assigned_technician=t.assigned_technician,
        due_date=t.due_date,
        resolution_notes=t.resolution_notes,
        actions_taken=t.actions_taken,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )

    prev_status = ticket.status
    update_data = ticket_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(ticket, field, val)

    ticket.updated_at = datetime.now(timezone.utc)

    # Log action if status changed
    if "status" in update_data and update_data["status"] != prev_status:
        act = MaintenanceAction(
            ticket_id=ticket.id,
            action_description=f"Status changed from '{prev_status}' to '{update_data['status']}'",
            performed_by=current_user.full_name if current_user else "Technician / Operator",
        )
        db.add(act)

    db.commit()
    db.refresh(ticket)

    audit = AuditEvent(
        action="UPDATE_TICKET",
        entity_type="MaintenanceTicket",
        entity_id=ticket.ticket_number,
        user_email=current_user.email if current_user else "anonymous",
        details=update_data,
    )
    db.add(audit)
    db.commit()

    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        asset_id=ticket.asset_id,
        asset_name=ticket.asset.name if ticket.asset else None,
        prediction_id=ticket.prediction_id,
        issue_summary=ticket.issue_summary,
        priority=ticket.priority,
        status=ticket.status,
        assigned_technician=ticket.assigned_technician,
        due_date=ticket.due_date,
        resolution_notes=ticket.resolution_notes,
        actions_taken=ticket.actions_taken,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.post("/tickets/{ticket_id}/actions", response_model=MaintenanceActionResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_action(
    ticket_id: int,
    action_in: MaintenanceActionCreate,
    db: Session = Depends(get_db),
):
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )

    act = MaintenanceAction(
        ticket_id=ticket_id,
        action_description=action_in.action_description,
        performed_by=action_in.performed_by,
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


@router.get("/tickets/{ticket_id}/actions", response_model=List[MaintenanceActionResponse])
def get_ticket_actions(ticket_id: int, db: Session = Depends(get_db)):
    actions = (
        db.query(MaintenanceAction)
        .filter(MaintenanceAction.ticket_id == ticket_id)
        .order_by(MaintenanceAction.performed_at.asc())
        .all()
    )
    return actions
