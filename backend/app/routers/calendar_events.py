from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.calendar_event import CalendarEvent, CalendarEventType
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventRead, CalendarEventUpdate
from app.senders.discord_events import create_calendar_event, delete_scheduled_event

router = APIRouter(prefix="/api/events", tags=["calendar_events"])


@router.get("", response_model=list[CalendarEventRead])
def list_events(
    date_: date | None = None,
    type_: CalendarEventType | None = None,
    db: DBSession = Depends(get_db),
):
    query = db.query(CalendarEvent)
    if date_ is not None:
        query = query.filter(CalendarEvent.event_date == date_)
    if type_ is not None:
        query = query.filter(CalendarEvent.type == type_)
    return query.order_by(CalendarEvent.event_date).all()


@router.post("", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
async def create_event(payload: CalendarEventCreate, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    event = CalendarEvent(**payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)

    event_id = await create_calendar_event(
        db, event.type.value, event.title, event.description, event.event_date, event.event_time
    )
    if event_id:
        event.discord_event_id = event_id
        db.commit()
        db.refresh(event)

    return event


@router.patch("/{event_id}", response_model=CalendarEventRead)
def update_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    event = db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일정을 찾을 수 없습니다")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: int, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    event = db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "일정을 찾을 수 없습니다")

    if event.discord_event_id:
        await delete_scheduled_event(db, event.discord_event_id)

    db.delete(event)
    db.commit()
