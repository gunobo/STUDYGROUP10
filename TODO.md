# TODO — study2026

`.claude/claude.md` 명세 기준 체크리스트. 현재 리포는 스켈레톤(기본 CRUD + 페이지 뼈대)까지만 잡혀 있음.

## 0. 인프라 준비
- [ ] Google Cloud Console에서 OAuth 2.0 클라이언트 생성 (승인된 리디렉션 URI: `https://study2026.bssm.dev/api/auth/google/callback`)
- [ ] `.env` 생성 후 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `JWT_SECRET` 실값 채우기
- [ ] `ALLOWED_EMAIL_DOMAINS`를 실제 학교 구글 워크스페이스 도메인으로 교체
- [ ] Cloudflare Tunnel에 `study2026.bssm.dev` 라우팅 연결 (기존 인프라 재사용)
- [ ] MySQL 마이그레이션 도구 세팅 (Alembic 초기화 — 현재는 `Base.metadata.create_all`로만 테이블 생성 중, 운영 전 전환 필요)

## 1. 인증 / 권한
- [x] Google OAuth 로그인/콜백/me/logout 라우터 스켈레톤
- [x] 도메인 화이트리스트 검증 + admin 이메일 화이트리스트(`startea0716@gmail.com`) 로직
- [ ] 실제 Google 클라이언트로 로그인 플로우 end-to-end 테스트
- [ ] 최초 로그인 시 자동 가입 흐름 프론트에서 확인 (리다이렉트 후 `/auth/me` 재조회)
- [ ] 미허용 도메인 로그인 시 403 에러 페이지/안내 UI
- [ ] JWT 쿠키 secure 옵션 (배포 시 `https`이므로 `secure=True` 적용)

## 2. 데이터 모델 / 백엔드
- [x] users, sessions, questions, feedbacks, fines, attendances 테이블 모델
- [x] 세션/질문/피드백/벌금/유저 기본 CRUD 라우터
- [x] applications 테이블 + API (참가 신청: 로그인 필요 `POST /api/applications`, admin `GET/PATCH`) — `.claude/claude.md`에는 없던 신규 기능, "모집 단계 지원서 검토" 용도로 추가. 필드: 학번/이름/전화번호/공부할 분야(2개+)/설명회 참여 가능 시간/개인정보 수집 동의/스터디 규칙 동의, `user_id`로 로그인 계정과 연결
- [ ] applications 테이블 스키마가 바뀌었으므로(email/motivation 컬럼 제거, user_id/student_id/topics 등 추가) 기존에 `docker compose up`으로 이미 만들어진 MySQL 볼륨이 있다면 `docker compose down -v`로 볼륨 삭제 후 재기동 필요 (Alembic 없이 `create_all`만 쓰고 있어 기존 테이블에 컬럼이 자동으로 추가되지 않음)
- [x] SolAPI SMS 연동 (`app/senders/solapi_client.py`, `app/senders/sms.py` — GIFTLINK 프로젝트에서 이식) — 관리자가 승인하며 설명회 일시/장소를 입력하면 신청자 휴대폰으로 안내 문자 발송
- [ ] `.env`에 실제 `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER_PHONE`(SolAPI에 등록된 발신번호) 채우기 — 비어있으면 승인은 되지만 문자 발송 실패(502) 처리됨
- [ ] applications 승인 시 실제 계정 연결/알림 로직은 없음 (승인해도 자동으로 로그인 권한이 생기는 게 아니라 여전히 학교 구글 계정 로그인이 기준 — 운영 방식 확정 필요)
- [ ] attendances API 라우터 (스펙에 "선택"이지만 모델만 있고 라우터 없음 — 필요 여부 결정)
- [ ] 질문 답변 로직: "다음 발표 전까지 조사 후 공유" — `resolved_before_session_id` 자동 설정/알림 로직
- [ ] 미해결 질문 대시보드 노출용 정렬/우선순위 로직 (`GET /api/questions/unresolved` 활용)
- [ ] 세션 상태 변경(연기/취소) 시 관련 벌금·질문 처리 정책 결정
- [ ] 입력 검증 강화 (예: `scheduled_date` 중복 방지, `topic` 필수값 등)
- [ ] 페이지네이션/정렬 옵션 (질문, 벌금 내역이 많아질 경우)
- [ ] 예외 처리 및 에러 응답 포맷 통일

## 3. 프론트엔드 페이지
- [x] 라우팅 스켈레톤 (`/`, `/apply`, `/schedule`, `/sessions/:id`, `/sessions/:id/questions`, `/fines`, `/members`, `/mypage`, `/login`, `/admin`)
- [x] AuthGuard (로그인/관리자 전용 라우트 보호)
- [x] `/apply` 참가 신청 폼 (로그인 필요, 학번/이름/전화번호/공부 분야 2개+/설명회 가능 시간/개인정보 동의/규칙 동의) + `/admin`에 승인/거절 UI
- [x] `/admin` 승인 시 설명회 일시/장소 입력 폼 → 승인 확정과 동시에 SolAPI 문자 발송
- [ ] `/apply` 제출 후 이메일 등 확인 알림 (현재는 화면 안내 문구만)
- [ ] `/` 홈: 다음 발표자뿐 아니라 최근 미해결 질문 요약 노출
- [ ] `/schedule`: 캘린더 뷰 (현재는 리스트만) — 기획서상 "캘린더/리스트" 중 캘린더 UI 추가 검토
- [ ] `/sessions/:id`: 발표자료 첨부 업로드 UI (선택 사항이지만 링크 입력 폼 필요)
- [ ] `/sessions/:id`: SessionTabs에 퀴즈 탭 → QuizRunner 실제 연결 (현재 quiz_json 표시만)
- [ ] `/sessions/:id/questions`: 답변 등록/해결 처리 UI (관리자 또는 발표자만 가능하도록 권한 분기)
- [ ] `/fines`: 참가자별 누적 벌금 테이블 (현재 전체 리스트만, 사용자별 그룹핑 필요)
- [ ] `/members`: 상세 프로필 라우트 `/members/:id` 추가 (Members.jsx에서 이미 링크 걸어둠, 페이지/라우트 미구현)
- [ ] `/mypage`: 내가 남긴 질문/피드백 목록 추가 (현재 발표 일정만 표시)
- [ ] `/admin`: 일정 생성/수정 폼, 벌금 부과 폼(사유 선택 + 면제 체크), 참가자 관리 UI (현재 목록 조회만)
- [ ] 로그인 상태에 따른 네비게이션 분기 (로그인/로그아웃 버튼, 관리자만 "관리자" 메뉴 노출)
- [ ] 로딩/에러 상태 UI (스피너, 에러 메시지)

## 4. 비기능 요구사항
- [ ] 반응형 스타일 (현재 최소 CSS만 존재, 모바일 breakpoint 없음)
- [ ] 질문은 로그인 사용자만 작성 가능하도록 프론트에서도 방어 (현재 백엔드만 `get_current_user` 의존)
- [ ] 관리자만 벌금 부과/일정 조정 가능하도록 프론트 UI 단에서도 버튼 숨김 처리

## 5. 배포
- [x] docker-compose.yml (frontend/backend/mysql)
- [x] backend/frontend Dockerfile
- [ ] frontend Dockerfile 빌드 시 `VITE_*` 환경변수 필요 여부 확인 (현재 `/api` 상대경로 + nginx 프록시로 불필요할 수 있음)
- [ ] Cloudflare Tunnel 설정 파일 (`cloudflared config.yml`) 리포에 추가할지 결정
- [ ] `docker compose up --build` 로컬 통합 테스트
- [ ] CI (lint/test) 파이프라인 여부 결정

## 6. 테스트
- [ ] 백엔드 API 테스트 (pytest) — 특히 도메인/admin 화이트리스트 로직
- [ ] 프론트 주요 플로우 수동 QA (로그인 → 세션 조회 → 질문 등록 → 관리자 벌금 부과)
