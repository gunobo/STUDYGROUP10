from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.session import SessionStatus


class SessionCreate(BaseModel):
    scheduled_date: date
    presenter_id: int | None = None
    topic: str | None = None
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


class SessionClaim(BaseModel):
    topic: str

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("발표 주제를 입력해야 합니다")
        return value


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    presenter_id: int | None
    topic: str | None
    scheduled_date: date
    status: SessionStatus
    material_url: str | None
    concept_note: str | None
    example_note: str | None
    demo_note: str | None
    summary_note: str | None
    quiz_json: dict | None
    created_at: datetime
