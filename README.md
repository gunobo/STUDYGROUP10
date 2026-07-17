# study2026 — 여름방학 회고 스터디

발표 일정, 자료 공유, 질문/피드백, 벌금 관리를 위한 스터디 운영 웹사이트.
전체 명세는 [.claude/claude.md](.claude/claude.md) 참고.

## 스택
- 프론트엔드: React + TypeScript (Vite)
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
alembic upgrade head   # DB 스키마 적용 (최초 1회 + 마이그레이션 추가될 때마다)
uvicorn app.main:app --reload
```

스키마는 Alembic으로 관리합니다 (`Base.metadata.create_all`은 더 이상 안 씀). 모델을 바꾸면:
```bash
alembic revision --autogenerate -m "설명"
alembic upgrade head
```

### 프론트엔드 (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

프론트는 `/api` 요청을 `vite.config.ts`의 프록시를 통해 `localhost:8000`으로 전달합니다.

타입만 체크하려면 `npm run typecheck` (빌드는 `tsc -b && vite build`로 타입 에러가 있으면 실패합니다).

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
chmod 777 cloudflared   # cloudflared 이미지의 nonroot 유저가 쓸 수 있도록 임시로 개방

# 1) 로그인 (URL이 출력되면 브라우저에서 열어 bssm.dev 선택 후 승인)
docker run -it --rm -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel login

# 2) 터널 생성 (출력되는 UUID를 기록해두기)
docker run -it --rm -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel create study2026

# 3) DNS 라우팅 (study2026.bssm.dev → 이 터널)
docker run -it --rm -v $(pwd)/cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel route dns study2026 study2026.bssm.dev

chmod 755 cloudflared   # 다 끝나면 다시 잠그기 (compose의 cloudflared 서비스는 읽기만 하면 되므로 755로 충분)
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

## 디스코드 봇 설정 (발표 신청 시 서버 이벤트 자동 등록)

학생이 마이페이지에서 발표를 신청하면 디스코드 서버 "이벤트"로 자동 등록됩니다 (음성채널 연결). 봇을 새로 만들어야 합니다.

1. [Discord Developer Portal](https://discord.com/developers/applications) 접속 → **New Application** → 이름 입력(예: study2026-bot) → 생성
2. 왼쪽 메뉴 **Bot** 탭 → **Reset Token** → 나온 토큰 복사 (`DISCORD_BOT_TOKEN`) — 이 화면 나가면 다시 못 보니 바로 저장
3. 왼쪽 메뉴 **OAuth2 → URL Generator** →
   - **SCOPES**: `bot` 체크
   - **BOT PERMISSIONS**: `Manage Events` 체크 (음성채널 확인용으로 `View Channels`도 체크 권장)
   - 하단에 생성된 URL을 브라우저에 붙여넣기 → 서버 관리 권한 있는 계정으로 로그인해서 봇을 스터디 서버에 초대
4. 디스코드 앱에서 **설정 → 고급 → 개발자 모드** 켜기
5. 서버 아이콘 우클릭 → **ID 복사** → `DISCORD_GUILD_ID`
6. 발표할 음성채널 우클릭 → **ID 복사** → `DISCORD_VOICE_CHANNEL_ID`
7. `.env`에 `DISCORD_BOT_TOKEN` / `DISCORD_GUILD_ID` / `DISCORD_VOICE_CHANNEL_ID`와, 실제 발표 시작 시각으로 `PRESENTATION_TIME`(예: `21:00`) 채우기

세 값(토큰/길드/채널) 중 하나라도 비어있으면 이벤트 등록 없이 조용히 스킵되고 나머지 기능엔 영향 없습니다. 세션이 "취소" 상태로 바뀌면 등록해둔 이벤트도 자동으로 삭제됩니다.

## 프로젝트 구조
```
backend/   FastAPI 앱 (app/models, schemas, routers)
frontend/  React + TypeScript (Vite) 앱 (src/pages, components, api, store, types.ts)
```

체크리스트는 [TODO.md](TODO.md) 참고.
