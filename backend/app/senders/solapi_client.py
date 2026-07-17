import hashlib
import hmac
import time
import uuid

import httpx

from app.core.config import settings

SOLAPI_BASE_URL = "https://api.solapi.com"


def _auth_header() -> str:
    """Solapi HMAC-SHA256 서명 헤더 생성. 공식 문서의 date+salt 조합 방식을 따른다."""
    date = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    salt = uuid.uuid4().hex
    signature = hmac.new(
        settings.solapi_api_secret.encode(), (date + salt).encode(), hashlib.sha256
    ).hexdigest()
    return f"HMAC-SHA256 apiKey={settings.solapi_api_key}, date={date}, salt={salt}, signature={signature}"


async def send_message(message: dict) -> dict:
    """Solapi POST /messages/v4/send 호출. 실패 시 httpx.HTTPStatusError를 그대로 던진다."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{SOLAPI_BASE_URL}/messages/v4/send",
            json={"message": message},
            headers={"Authorization": _auth_header(), "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        return resp.json()
