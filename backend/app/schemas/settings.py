import re
from datetime import datetime

from pydantic import BaseModel, field_validator

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class SettingsRead(BaseModel):
    application_opens_at: datetime | None
    application_closes_at: datetime | None
    is_open: bool
    orientation_options: list[str]
    discord_guild_id: str | None
    discord_voice_channel_id: str | None
    presentation_time: str | None
    presentation_duration_minutes: int | None


class SettingsUpdate(BaseModel):
    application_opens_at: datetime | None = None
    application_closes_at: datetime | None = None
    orientation_options: list[str] | None = None
    discord_guild_id: str | None = None
    discord_voice_channel_id: str | None = None
    presentation_time: str | None = None
    presentation_duration_minutes: int | None = None

    @field_validator("presentation_time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is not None and not TIME_RE.match(value):
            raise ValueError("presentation_time은 HH:MM 형식이어야 합니다 (예: 21:00)")
        return value
