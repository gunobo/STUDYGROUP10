import asyncio
import logging

import discord

from app.core.config import settings

logger = logging.getLogger("app")

_client: discord.Client | None = None
_task: asyncio.Task | None = None


def _build_client() -> discord.Client:
    client = discord.Client(intents=discord.Intents.default())

    @client.event
    async def on_ready() -> None:
        logger.info("디스코드 봇 온라인: %s", client.user)
        await client.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="발표 신청"))

    return client


async def _run() -> None:
    global _client
    _client = _build_client()
    try:
        await _client.start(settings.discord_bot_token)
    except discord.LoginFailure:
        logger.error("디스코드 봇 토큰이 유효하지 않습니다 — 봇 없이 REST 이벤트 등록만 계속 동작합니다")
    except Exception:
        logger.exception("디스코드 봇 연결 실패 — 봇 없이 REST 이벤트 등록만 계속 동작합니다")


def launch() -> None:
    """설정된 경우에만 백그라운드로 디스코드 게이트웨이에 접속해 봇을 '온라인' 상태로 띄운다.
    REST 기반 이벤트 생성/삭제(discord_events.py)는 이 봇 연결과 무관하게 항상 동작한다."""
    global _task
    if not settings.discord_bot_token:
        return
    _task = asyncio.create_task(_run())


async def shutdown() -> None:
    global _client, _task
    if _client is not None and not _client.is_closed():
        await _client.close()
    if _task is not None:
        _task.cancel()
