# TODO — study2026

`.claude/claude.md` 명세 + 이후 추가 요청 기준 체크리스트.

## 0. 인프라 / 배포
- [x] study2026 전용 Cloudflare Tunnel 생성 및 연결 — `study2026.bssm.dev` 정상 서비스 확인 (HTTP 200, `/api/health` OK)
- [x] `docker-compose.yml`에 `cloudflared` 서비스 포함, 다른 프로젝트(giftlink/meistertrack/jeminmail 등)와 안 겹치는 포트로 고정 (frontend 5103 / backend 8005 / mysql 3313)
- [x] 파이에서 `docker compose up -d --build` 통합 기동 확인
- [ ] Google Cloud Console에서 실제 OAuth 2.0 클라이언트 발급 + 리디렉션 URI(`https://study2026.bssm.dev/api/auth/google/callback`) 등록
- [ ] `.env`에 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 실값 채우기 (JWT_SECRET은 이미 생성해서 채움)
- [ ] `ALLOWED_EMAIL_DOMAINS`를 실제 학교 구글 워크스페이스 도메인으로 교체 확인
- [ ] `.env`에 `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER_PHONE` 실값 채우기 (비어있으면 승인은 되지만 문자 발송은 502 실패)
- [ ] MySQL 마이그레이션 도구 세팅 (Alembic) — 현재는 `Base.metadata.create_all`만 써서 기존 테이블에 컬럼이 자동으로 안 생김. **applications 테이블 스키마가 이번에 또 바뀌어서(학번/분야/동의 필드 추가) 파이에 이미 만들어진 볼륨이 있다면 `docker compose down -v` 후 재기동 필요** (실제 신청 데이터가 있으면 알려주면 데이터 보존 방법 안내)
- [ ] CI(lint/test) 파이프라인 여부 결정

## 1. 인증 / 권한
- [x] Google OAuth 로그인/콜백/me/logout 라우터
- [x] 도메인 화이트리스트 + admin 이메일 화이트리스트(`startea0716@gmail.com`) 로직
- [x] 관리자가 다른 참가자의 role(member/admin)을 `/admin`에서 직접 변경 가능 (본인 역할 변경은 막아둠)
- [ ] 실제 Google 클라이언트로 로그인 플로우 end-to-end 테스트 (0번 OAuth 클라이언트 발급 후 진행)
- [ ] 미허용 도메인 로그인 시 403 에러 페이지/안내 UI (현재 API 403만 응답)
- [ ] JWT 쿠키 `secure=True` 적용 여부 확인 (배포 도메인이 https이므로 켜는 게 맞음)
- [ ] 로그인 상태에 따른 네비게이션 분기 (로그인/로그아웃 버튼 노출, 관리자 아닌데 "관리자" 메뉴 계속 보이는 문제 — 클릭하면 AuthGuard가 막긴 하지만 UI상 숨기는 게 자연스러움)

## 2. 데이터 모델 / 백엔드
- [x] users, sessions, questions, feedbacks, fines, attendances 테이블 모델
- [x] 세션/질문/피드백/벌금/유저 기본 CRUD 라우터
- [x] applications 테이블 + API — 로그인 필요, 필드: 학번/이름/전화번호/공부할 분야(2개 이상)/설명회 참여 가능 시간/개인정보 수집 동의/스터디 규칙 동의. `user_id`로 로그인 계정과 연결, 동일 유저 중복 신청(거절 제외) 차단
- [x] 참가 신청 기간 제한 — `APPLICATION_OPENS_AT` / `APPLICATION_CLOSES_AT` 환경변수로 설정, `GET /api/applications/window`(공개)로 프론트에 기간 노출, 기간 아니면 `POST` 400 거부
- [x] SolAPI SMS 연동 — 관리자가 승인하며 설명회 일시/장소를 입력하면 신청자 휴대폰으로 안내 문자 발송
- [ ] applications 승인 시 실제 로그인 권한과 자동 연결되는 로직은 없음 (승인해도 여전히 학교 구글 계정이면 누구나 로그인 가능 — 신청 승인을 로그인 게이트로 쓸 건지 운영 방식 확정 필요)
- [ ] attendances API 라우터 (스펙에 "선택"이지만 모델만 있고 라우터 없음)
- [ ] 질문 답변 로직: "다음 발표 전까지 조사 후 공유" — `resolved_before_session_id` 자동 설정/알림 로직
- [ ] 미해결 질문 대시보드 노출 (`GET /api/questions/unresolved` 아직 프론트에서 안 씀)
- [ ] 세션 상태 변경(연기/취소) 시 관련 벌금·질문 처리 정책 결정
- [ ] 세션/질문 등 나머지 입력 검증 강화 (applications는 이미 꼼꼼히 검증됨)
- [ ] 페이지네이션/정렬 옵션 (질문, 벌금 내역이 많아질 경우)
- [ ] 예외 처리 및 에러 응답 포맷 통일

## 3. 프론트엔드 페이지
- [x] 라우팅 (`/`, `/apply`, `/schedule`, `/sessions/:id`, `/sessions/:id/questions`, `/fines`, `/members`, `/mypage`, `/login`, `/admin`)
- [x] AuthGuard (로그인/관리자 전용 라우트 보호) — `/apply`도 로그인 필요로 전환
- [x] `/apply` — 로그인 필요, 학번/이름/전화번호/분야(2개+ 동적 추가)/설명회 가능 시간/개인정보 동의/규칙 동의(예·아니오), 신청 기간 아니면 폼 대신 안내 문구
- [x] `/admin` — 신청 승인/거절 + 설명회 일시·장소 입력 후 SMS 발송, 참가자 role 변경
- [x] `/` 홈 — 스터디 소개 전체 콘텐츠(진행 방식/발표 구성/참가자 역할/질문 문화/목표/벌금표/클로징 문구) + 다음 발표 카드
- [x] `/sessions/:id` — SessionTabs의 Q&A 탭이 실제 질문 목록 조회 + 등록 폼으로 동작 (예전엔 빈 화면이었음)
- [x] 디자인 시스템 전면 개편 (카드/뱃지/버튼/폼 스타일, sticky 네비게이션)
- [x] 반응형 CSS — 640px 이하에서 네비/폼/테이블/카드 레이아웃 조정, 테이블은 `.table-wrap`으로 가로 스크롤 처리, 모바일 네비 텍스트가 세로로 깨지던 버그 수정(`white-space: nowrap` 누락)
- [ ] `/apply` 제출 후 이메일 등 확인 알림 (현재는 화면 안내 문구만)
- [ ] `/schedule`: 캘린더 뷰 (현재는 리스트만)
- [ ] `/sessions/:id`: 발표자료 첨부/업로드 UI, 퀴즈 탭 → QuizRunner 실제 연결 (현재 quiz_json 그대로 표시만 함)
- [ ] `/sessions/:id/questions`(및 Q&A 탭): 답변 등록/해결 처리 UI (관리자·발표자만 가능하도록 권한 분기) — 지금은 질문 작성만 가능
- [ ] `/fines`: 참가자별 누적 벌금 그룹핑 (현재 전체 리스트 + 총액만)
- [ ] `/members/:id` 상세 프로필 라우트/페이지 (Members.jsx에 링크는 이미 있음)
- [ ] `/mypage`: 내가 남긴 질문/피드백 목록 추가 (현재 발표 일정만)
- [ ] `/admin`: 일정 생성/수정 폼, 벌금 부과 폼(사유 선택 + 면제 체크) — 지금은 목록 조회만 가능
- [ ] 로딩/에러 상태 UI (스피너, 공통 에러 메시지 컴포넌트)

## 4. 비기능 요구사항
- [x] 반응형 스타일
- [ ] 질문 작성이 로그인 사용자만 가능하다는 걸 프론트에서도 방어 (현재 QuestionBoard/Q&A 탭에 AuthGuard 없음 — 비로그인 상태로 등록 시도하면 백엔드 401만 나고 화면엔 에러 표시 없음)
- [ ] 관리자만 벌금 부과/일정 조정 가능하도록 프론트 UI에서 버튼 숨김 처리 (현재 해당 폼 자체가 없어서 실질적으로 문제는 없음, 폼 추가 시 같이 처리)

## 5. 테스트
- [ ] 백엔드 API 테스트 (pytest) — 도메인/admin 화이트리스트, applications 검증 로직, 신청 기간 제한
- [ ] 프론트 주요 플로우 수동 QA (로그인 → 참가 신청 → 관리자 승인 → SMS 수신 → 세션 질문 등록)
