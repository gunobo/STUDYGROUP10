from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate
from app.senders.sms import send_sms

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _approval_message(application: Application) -> str:
    when = application.orientation_at.strftime("%Y-%m-%d %H:%M") if application.orientation_at else "추후 안내"
    where = application.orientation_place or "추후 안내"
    return (
        f"[study2026] {application.name}님, 여름방학 회고 스터디 참가 신청이 승인되었습니다.\n"
        f"설명회: {when} / {where}"
    )


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: DBSession = Depends(get_db)):
    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=list[ApplicationRead])
def list_applications(db: DBSession = Depends(get_db), _=Depends(require_admin)):
    return db.query(Application).order_by(Application.created_at.desc()).all()


@router.patch("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "신청 내역을 찾을 수 없습니다")

    application.status = payload.status
    if payload.orientation_at is not None:
        application.orientation_at = payload.orientation_at
    if payload.orientation_place is not None:
        application.orientation_place = payload.orientation_place

    if payload.status == ApplicationStatus.approved:
        result = await send_sms(application.phone or "", _approval_message(application))
        application.sms_sent = result.success
        db.commit()
        db.refresh(application)
        if not result.success:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                f"승인 처리는 완료되었지만 문자 발송에 실패했습니다: {result.error_msg}",
            )
        return application

    db.commit()
    db.refresh(application)
    return application
