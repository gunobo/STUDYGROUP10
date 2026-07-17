# study2026 — 여름방학 회고 스터디

발표 일정, 자료 공유, 질문/피드백, 벌금 관리를 위한 스터디 운영 웹사이트.
전체 명세는 [.claude/claude.md](.claude/claude.md) 참고.

## 스택
- 프론트엔드: React (Vite)
- 백엔드: FastAPI
- DB: MySQL
- 인증: Google OAuth 2.0 (학교 구글 계정 화이트리스트)
- 배포: Docker Compose + Cloudflare Tunnel (study2026 전용 터널)

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
파이 서버에 다른 프로젝트들(giftlink, meistertrack, jeminmail 등)이 이미 5100~5102, 8001~8004, 3305/3310~3312 등의 포트를 쓰고 있어 겹치지 않는 포트로 고정했습니다.
- frontend: http://localhost:5103
- backend: http://localhost:8005
- mysql: localhost:3313

### 배포 (Cloudflare Tunnel)
study2026 전용 터널을 CLI로 새로 파서 `docker-compose.yml`의 `cloudflared` 서비스로 같이 띄웁니다 (다른 프로젝트의 터널/설정은 건드리지 않음). `cloudflared/` 디렉토리에 인증서·자격증명이 생기며 git에는 커밋되지 않습니다.

```bash
mkdir -p cloudflared

# 1) 로그인 (URL이 출력되면 브라우저에서 열어 bssm.dev 선택 후 승인)
docker run -it --rm -u $(id -u):$(id -g) -e HOME=/home/nonroot -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel login

# 2) 터널 생성 (출력되는 UUID를 기록해두기)
docker run -it --rm -u $(id -u):$(id -g) -e HOME=/home/nonroot -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel create study2026

# 3) DNS 라우팅 (study2026.bssm.dev → 이 터널)
docker run -it --rm -u $(id -u):$(id -g) -e HOME=/home/nonroot -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel route dns study2026 study2026.bssm.dev
```

`cloudflared/config.yml` 생성 (2번에서 나온 UUID로 `<TUNNEL_UUID>` 교체):
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json
ingress:
  - hostname: study2026.bssm.dev
    service: http://frontend:80
  - service: http_status:404
```

```bash
docker compose up -d --build
docker ps | grep cloudflared   # study2026-cloudflared-1 확인
curl -I https://study2026.bssm.dev
```

## 프로젝트 구조
```
backend/   FastAPI 앱 (app/models, schemas, routers)
frontend/  React (Vite) 앱 (src/pages, components, api, store)
```

체크리스트는 [TODO.md](TODO.md) 참고.
