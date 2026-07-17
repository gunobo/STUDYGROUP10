from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.session import SessionStatus


class SessionCreate(BaseModel):
    presenter_id: int
    topic: str
    scheduled_date: date
    material_url: str | None = None


class SessionUpdate(BaseModel):
    topic: str | None = None
    scheduled_date: date | None = None
    status: SessionStatus | None = None
    material_url: str | None = None
    concept_note: str | None = None
    example_note: str | None = None
    demo_note: str | None = None
    summary_note: str | None = None
    quiz_json: dict | None = None


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    presenter_id: int
    topic: str
    scheduled_date: date
    status: SessionStatus
    material_url: str | None
    concept_note: str | None
    example_note: str | None
    demo_note: str | None
    summary_note: str | None
    quiz_json: dict | None
    created_at: datetime
