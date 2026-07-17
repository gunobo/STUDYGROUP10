from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session as DBSession

from app.core.config import settings
from app.core.security import create_access_token
from app.db.base import get_db
from app.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserRead

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _resolve_role(email: str) -> UserRole:
    if email.lower() in settings.admin_emails_list:
        return UserRole.admin
    return UserRole.member


def _is_allowed_email(email: str) -> bool:
    if email.lower() in settings.admin_emails_list:
        return True
    domain = email.rsplit("@", 1)[-1].lower()
    return domain in settings.allowed_domains_list


@router.get("/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, settings.google_redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: DBSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if userinfo is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "구글 인증에 실패했습니다")

    email = userinfo["email"]
    if not _is_allowed_email(email):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "허용되지 않은 계정입니다")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            name=userinfo.get("name", email),
            email=email,
            google_sub=userinfo["sub"],
            profile_image_url=userinfo.get("picture"),
            role=_resolve_role(email),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(user.id)
    response = RedirectResponse(url=settings.frontend_url)
    response.set_cookie(
        "access_token",
        jwt_token,
        httponly=True,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )
    return response


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}
