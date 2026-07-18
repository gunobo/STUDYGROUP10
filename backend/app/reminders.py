import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.db.base import SessionLocal
from app.models.session import Session, SessionClaimStatus, SessionStatus
from app.models.user import User
from app.senders.discord import send_discord_message

logger = logging.getLogger("app")

KST = timezone(timedelta(hours=9))
REMINDER_HOUR = 9  # 매일 이 시각(KST)에 내일 발표를 확인해서 알림


async def _send_tomorrow_reminders() -> None:
    db = SessionLocal()
    try:
        tomorrow = (datetime.now(KST) + timedelta(days=1)).date()
        sessions = (
            db.query(Session)
            .filter(
                Session.scheduled_date == tomorrow,
                Session.status == SessionStatus.scheduled,
                Session.claim_status == SessionClaimStatus.approved,
            )
            .all()
        )
        for session in sessions:
            presenter = db.get(User, session.presenter_id)
            name = presenter.name if presenter else "발표자"
            await send_discord_message(
                f"⏰ 내일(**{session.scheduled_date}**) **{name}**님의 발표가 있습니다!\n주제: {session.topic}"
            )
    finally:
        db.close()


async def _loop() -> None:
    while True:
        now = datetime.now(KST)
        next_run = now.replace(hour=REMINDER_HOUR, minute=0, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        await asyncio.sleep((next_run - now).total_seconds())
        try:
            await _send_tomorrow_reminders()
        except Exception:
            logger.exception("발표 리마인더 발송 실패")


_task: asyncio.Task | None = None


def launch() -> None:
    """매일 REMINDER_HOUR(KST)에 내일 확정된 발표가 있으면 디스코드로 알림.
    DISCORD_WEBHOOK_URL이 없으면 send_discord_message가 조용히 스킵하므로 여기선 별도 설정 체크 불필요."""
    global _task
    _task = asyncio.create_task(_loop())


def shutdown() -> None:
    if _task is not None:
        _task.cancel()
