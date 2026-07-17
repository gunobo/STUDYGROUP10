# study2026 — 여름방학 회고 스터디

발표 일정, 자료 공유, 질문/피드백, 벌금 관리를 위한 스터디 운영 웹사이트.
전체 명세는 [.claude/claude.md](.claude/claude.md) 참고.

## 스택
- 프론트엔드: React (Vite)
- 백엔드: FastAPI
- DB: MySQL
- 인증: Google OAuth 2.0 (학교 구글 계정 화이트리스트)
- 배포: Docker Compose + Cloudflare Tunnel

## 로컬 개발

### 환경변수
```bash
cp .env.example .env
# Google OAuth 클라이언트 ID/Secret 등 채워넣기
```

### 백엔드 (FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 프론트엔드 (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

프론트는 `/api` 요청을 `vite.config.js`의 프록시를 통해 `localhost:8000`으로 전달합니다.

## Docker Compose로 전체 실행
```bash
cp .env.example .env
docker compose up --build
```
- frontend: http://localhost
- backend: http://localhost:8000
- mysql: localhost:3306

## 프로젝트 구조
```
backend/   FastAPI 앱 (app/models, schemas, routers)
frontend/  React (Vite) 앱 (src/pages, components, api, store)
```

체크리스트는 [TODO.md](TODO.md) 참고.
