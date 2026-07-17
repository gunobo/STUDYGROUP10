import logging
from datetime import date, datetime, time, timedelta

import httpx

from app.core.config import settings

logger = logging.getLogger("app")

DISCORD_API = "https://discord.com/api/v10"


def _is_configured() -> bool:
    return bool(settings.discord_bot_token and settings.discord_guild_id and settings.discord_voice_channel_id)


def _start_datetime(scheduled_date: date) -> datetime:
    hour, minute = (int(part) for part in settings.presentation_time.split(":"))
    return datetime.combine(scheduled_date, time(hour=hour, minute=minute))


async def create_scheduled_event(scheduled_date: date, topic: str, presenter_name: str) -> str | None:
    """발표 신청을 디스코드 서버 이벤트로 등록. 실패해도 예외 없이 None을 반환한다."""
    if not _is_configured():
        return None

    start = _start_datetime(scheduled_date)
    end = start + timedelta(minutes=settings.presentation_duration_minutes)

    payload = {
        "name": f"{presenter_name} - {topic}",
        "description": f"여름방학 회고 스터디 발표: {topic}",
        "scheduled_start_time": start.isoformat(),
        "scheduled_end_time": end.isoformat(),
        "privacy_level": 2,  # GUILD_ONLY (현재 지원되는 유일한 값)
        "entity_type": 2,  # VOICE
        "channel_id": settings.discord_voice_channel_id,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{DISCORD_API}/guilds/{settings.discord_guild_id}/scheduled-events",
                json=payload,
                headers={"Authorization": f"Bot {settings.discord_bot_token}"},
            )
            resp.raise_for_status()
            return resp.json().get("id")
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 생성 실패")
        return None


async def delete_scheduled_event(event_id: str) -> None:
    if not _is_configured():
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.delete(
                f"{DISCORD_API}/guilds/{settings.discord_guild_id}/scheduled-events/{event_id}",
                headers={"Authorization": f"Bot {settings.discord_bot_token}"},
            )
            if resp.status_code != 404:
                resp.raise_for_status()
    except httpx.HTTPError:
        logger.exception("디스코드 이벤트 삭제 실패")
