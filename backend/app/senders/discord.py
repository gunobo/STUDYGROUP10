import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("app")


async def send_discord_message(content: str) -> None:
    """일정 알림용 디스코드 웹훅 발송. 부가 기능이라 실패해도 요청 흐름을 막지 않는다."""
    if not settings.discord_webhook_url:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(settings.discord_webhook_url, json={"content": content})
            resp.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Discord webhook 발송 실패")
