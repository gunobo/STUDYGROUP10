import logging
from datetime import date, datetime, time, timedelta, timezone

import httpx
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings as env_settings
from app.models.settings import StudySettings
from app.services.settings import get_settings

logger = logging.getLogger("app")

DISCORD_API = "https://discord.com/api/v10"
KST = timezone(timedelta(hours=9))


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


def _combine(event_date: date, time_str: str) -> datetime:
    hour, minute = (int(part) for part in time_str.split(":"))
    # 타임존 없는 ISO8601 문자열은 디스코드 API가 형식 오류로 거부하거나 UTC로 오해석해
    # 엉뚱한 시각에 이벤트가 뜨므로, 한국 시간(KST, UTC+9)을 명시해서 보낸다.
    return datetime.combine(event_date, time(hour=hour, minute=minute), tzinfo=KST)


async def _post_scheduled_event(
    db: DBSession, name: str, description: str, start: datetime, end: datetime
) -> str | None:
    row = get_settings(db)
    if not _is_configured(row):
        return None

    payload = {
        "name": name,
        "description": description,
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
        if resp.status_code >= 400:
            logger.error("디스코드 이벤트 생성 실패 (HTTP %s): %s", resp.status_code, resp.text)
            return None
        return resp.json().get("id")
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 생성 실패")
        return None


async def create_scheduled_event(db: DBSession, scheduled_date: date, topic: str, presenter_name: str) -> str | None:
    """발표 신청을 디스코드 서버 이벤트로 등록. 실패해도 예외 없이 None을 반환한다."""
    row = get_settings(db)
    start = _combine(scheduled_date, _presentation_time(row))
    end = start + timedelta(minutes=_presentation_duration(row))
    return await _post_scheduled_event(
        db, f"{presenter_name} - {topic}", f"여름방학 회고 스터디 발표: {topic}", start, end
    )


async def create_calendar_event(
    db: DBSession, event_type: str, title: str, description: str | None, event_date: date, event_time: str | None
) -> str | None:
    """설명회/공지/회의 등 일정 이벤트를 디스코드 서버 이벤트로 등록. 실패해도 예외 없이 None을 반환한다."""
    row = get_settings(db)
    start = _combine(event_date, event_time or _presentation_time(row))
    end = start + timedelta(minutes=_presentation_duration(row))
    return await _post_scheduled_event(
        db, f"[{event_type}] {title}", description or f"{event_type}: {title}", start, end
    )


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
        if resp.status_code >= 400 and resp.status_code != 404:
            logger.error("디스코드 이벤트 삭제 실패 (HTTP %s): %s", resp.status_code, resp.text)
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 삭제 실패")
