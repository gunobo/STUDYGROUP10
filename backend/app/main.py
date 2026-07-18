import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app import discord_bot, reminders
from app.core.config import settings
from app.routers import (
    applications,
    attendances,
    auth,
    calendar_events,
    feedbacks,
    fines,
    questions,
    sessions,
)
from app.routers import settings as settings_router
from app.routers import users

logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    discord_bot.launch()
    reminders.launch()
    yield
    await discord_bot.shutdown()
    reminders.shutdown()


app = FastAPI(title="여름방학 회고 스터디 API", lifespan=lifespan)

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "서버 오류가 발생했습니다"})


app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(questions.sessions_router)
app.include_router(questions.questions_router)
app.include_router(feedbacks.sessions_router)
app.include_router(feedbacks.feedbacks_router)
app.include_router(fines.router)
app.include_router(users.router)
app.include_router(applications.router)
app.include_router(settings_router.router)
app.include_router(attendances.sessions_router)
app.include_router(attendances.attendances_router)
app.include_router(calendar_events.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
