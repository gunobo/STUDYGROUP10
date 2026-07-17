from datetime import datetime

from pydantic import BaseModel


class SettingsRead(BaseModel):
    application_opens_at: datetime | None
    application_closes_at: datetime | None
    is_open: bool
    orientation_options: list[str]


class SettingsUpdate(BaseModel):
    application_opens_at: datetime | None = None
    application_closes_at: datetime | None = None
    orientation_options: list[str] | None = None
