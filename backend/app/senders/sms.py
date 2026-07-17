from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.senders.solapi_client import send_message


@dataclass
class SendResult:
    success: bool
    error_msg: str | None = None


async def send_sms(phone: str, text: str) -> SendResult:
    if not phone:
        return SendResult(success=False, error_msg="전화번호가 없어 SMS를 보낼 수 없습니다.")
    if not settings.solapi_api_key or not settings.solapi_api_secret:
        return SendResult(success=False, error_msg="Solapi API 키가 설정되어 있지 않습니다.")
    if not settings.solapi_sender_phone:
        return SendResult(success=False, error_msg="발신번호(SOLAPI_SENDER_PHONE)가 설정되어 있지 않습니다.")

    payload = {
        "to": phone.replace("-", ""),
        "from": settings.solapi_sender_phone.replace("-", ""),
        "text": text,
    }

    try:
        await send_message(payload)
        return SendResult(success=True)
    except httpx.HTTPStatusError as exc:
        return SendResult(success=False, error_msg=f"Solapi 오류({exc.response.status_code}): {exc.response.text}")
    except Exception as exc:  # noqa: BLE001
        return SendResult(success=False, error_msg=str(exc))
