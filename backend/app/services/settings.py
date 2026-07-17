from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings as env_settings
from app.models.settings import StudySettings


def get_settings(db: Session) -> StudySettings:
    row = db.query(StudySettings).first()
    if row is None:
        row = StudySettings(
            application_opens_at=env_settings.application_opens_at,
            application_closes_at=env_settings.application_closes_at,
            orientation_options=[],
            discord_guild_id=env_settings.discord_guild_id or None,
            discord_voice_channel_id=env_settings.discord_voice_channel_id or None,
            presentation_time=env_settings.presentation_time or None,
            presentation_duration_minutes=env_settings.presentation_duration_minutes or None,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def is_application_open(row: StudySettings, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    if row.application_opens_at and now < row.application_opens_at:
        return False
    if row.application_closes_at and now > row.application_closes_at:
        return False
    return True
