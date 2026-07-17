from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.db.base import Base, engine
from app.routers import applications, auth, feedbacks, fines, questions, sessions, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="여름방학 회고 스터디 API")

app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(questions.sessions_router)
app.include_router(questions.questions_router)
app.include_router(feedbacks.router)
app.include_router(fines.router)
app.include_router(users.router)
app.include_router(applications.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
