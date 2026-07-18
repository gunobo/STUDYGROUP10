from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.calendar_event import CalendarEventType


class CalendarEventCreate(BaseModel):
    type: CalendarEventType
    title: str
    description: str | None = None
    event_date: date

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("제목을 입력해야 합니다")
        return value


class CalendarEventUpdate(BaseModel):
    type: CalendarEventType | None = None
    title: str | None = None
    description: str | None = None
    event_date: date | None = None


class CalendarEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: CalendarEventType
    title: str
    description: str | None
    event_date: date
    created_at: datetime
