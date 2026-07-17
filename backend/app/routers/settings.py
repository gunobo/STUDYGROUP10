from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.schemas.settings import SettingsRead, SettingsUpdate
from app.services.settings import get_settings, is_application_open

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _to_read(row) -> SettingsRead:
    return SettingsRead(
        application_opens_at=row.application_opens_at,
        application_closes_at=row.application_closes_at,
        is_open=is_application_open(row),
        orientation_options=row.orientation_options or [],
        discord_guild_id=row.discord_guild_id,
        discord_voice_channel_id=row.discord_voice_channel_id,
        presentation_time=row.presentation_time,
        presentation_duration_minutes=row.presentation_duration_minutes,
    )


@router.get("", response_model=SettingsRead)
def read_settings(db: DBSession = Depends(get_db)):
    return _to_read(get_settings(db))


@router.patch("", response_model=SettingsRead)
def update_settings(
    payload: SettingsUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    row = get_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return _to_read(row)
