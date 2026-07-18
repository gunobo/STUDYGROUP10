import re
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.calendar_event import CalendarEventType

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class CalendarEventCreate(BaseModel):
    type: CalendarEventType
    title: str
    description: str | None = None
    event_date: date
    event_time: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("제목을 입력해야 합니다")
        return value

    @field_validator("event_time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is not None and not TIME_RE.match(value):
            raise ValueError("event_time은 HH:MM 형식이어야 합니다 (예: 21:00)")
        return value


class CalendarEventUpdate(BaseModel):
    type: CalendarEventType | None = None
    title: str | None = None
    description: str | None = None
    event_date: date | None = None
    event_time: str | None = None

    @field_validator("event_time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is not None and not TIME_RE.match(value):
            raise ValueError("event_time은 HH:MM 형식이어야 합니다 (예: 21:00)")
        return value


class CalendarEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: CalendarEventType
    title: str
    description: str | None
    event_date: date
    event_time: str | None
    created_at: datetime
