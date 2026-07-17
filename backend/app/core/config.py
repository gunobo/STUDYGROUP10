from datetime import datetime

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # DB
    database_url: str = "mysql+pymysql://study:study@mysql:3306/study2026"

    # JWT
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    # 학교 구글 계정 도메인 화이트리스트 (콤마 구분)
    allowed_email_domains: str = "bssm.hs.kr"
    # 개인 계정이지만 admin 권한을 부여할 이메일 화이트리스트 (콤마 구분)
    admin_emails: str = "startea0716@gmail.com"

    frontend_url: str = "http://localhost:5173"

    # SolAPI (참가 신청 승인 시 문자 발송)
    solapi_api_key: str = ""
    solapi_api_secret: str = ""
    solapi_sender_phone: str = ""

    # 참가 신청 기간 (비워두면 해당 방향 제한 없음)
    application_opens_at: datetime | None = None
    application_closes_at: datetime | None = None

    # 디스코드 웹훅 (일정 오픈/발표 신청 알림, 비워두면 알림 안 보냄)
    discord_webhook_url: str = ""

    @property
    def allowed_domains_list(self) -> list[str]:
        return [d.strip() for d in self.allowed_email_domains.split(",") if d.strip()]

    @property
    def admin_emails_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


settings = Settings()
