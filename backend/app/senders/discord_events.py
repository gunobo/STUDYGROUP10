import logging
from datetime import date, datetime, time, timedelta

import httpx
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings as env_settings
from app.models.settings import StudySettings
from app.services.settings import get_settings

logger = logging.getLogger("app")

DISCORD_API = "https://discord.com/api/v10"


def _guild_id(row: StudySettings) -> str:
    return row.discord_guild_id or env_settings.discord_guild_id


def _voice_channel_id(row: StudySettings) -> str:
    return row.discord_voice_channel_id or env_settings.discord_voice_channel_id


def _presentation_time(row: StudySettings) -> str:
    return row.presentation_time or env_settings.presentation_time


def _presentation_duration(row: StudySettings) -> int:
    return row.presentation_duration_minutes or env_settings.presentation_duration_minutes


def _is_configured(row: StudySettings) -> bool:
    return bool(env_settings.discord_bot_token and _guild_id(row) and _voice_channel_id(row))


def _start_datetime(scheduled_date: date, row: StudySettings) -> datetime:
    hour, minute = (int(part) for part in _presentation_time(row).split(":"))
    return datetime.combine(scheduled_date, time(hour=hour, minute=minute))


async def create_scheduled_event(db: DBSession, scheduled_date: date, topic: str, presenter_name: str) -> str | None:
    """발표 신청을 디스코드 서버 이벤트로 등록. 실패해도 예외 없이 None을 반환한다."""
    row = get_settings(db)
    if not _is_configured(row):
        return None

    start = _start_datetime(scheduled_date, row)
    end = start + timedelta(minutes=_presentation_duration(row))

    payload = {
        "name": f"{presenter_name} - {topic}",
        "description": f"여름방학 회고 스터디 발표: {topic}",
        "scheduled_start_time": start.isoformat(),
        "scheduled_end_time": end.isoformat(),
        "privacy_level": 2,  # GUILD_ONLY (현재 지원되는 유일한 값)
        "entity_type": 2,  # VOICE
        "channel_id": _voice_channel_id(row),
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{DISCORD_API}/guilds/{_guild_id(row)}/scheduled-events",
                json=payload,
                headers={"Authorization": f"Bot {env_settings.discord_bot_token}"},
            )
            resp.raise_for_status()
            return resp.json().get("id")
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 생성 실패")
        return None


async def delete_scheduled_event(db: DBSession, event_id: str) -> None:
    row = get_settings(db)
    if not _is_configured(row):
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.delete(
                f"{DISCORD_API}/guilds/{_guild_id(row)}/scheduled-events/{event_id}",
                headers={"Authorization": f"Bot {env_settings.discord_bot_token}"},
            )
            if resp.status_code != 404:
                resp.raise_for_status()
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 삭제 실패")
