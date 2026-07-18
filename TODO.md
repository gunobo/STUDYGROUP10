# TODO — study2026

`.claude/claude.md` 명세 + 이후 추가 요청 기준 체크리스트.

## 0. 인프라 / 배포
- [x] study2026 전용 Cloudflare Tunnel 생성 및 연결 — `study2026.bssm.dev` 정상 서비스 확인 (HTTP 200, `/api/health` OK)
- [x] `docker-compose.yml`에 `cloudflared` 서비스 포함, 다른 프로젝트(giftlink/meistertrack/jeminmail 등)와 안 겹치는 포트로 고정 (frontend 5103 / backend 8005 / mysql 3313)
- [x] 파이에서 `docker compose up -d --build` 통합 기동 확인
- [x] Alembic 마이그레이션 도입 — `Base.metadata.create_all` 제거, `backend/entrypoint.sh`가 컨테이너 시작 시 `alembic upgrade head`를 자동 실행
- [ ] **지금 당장**: 파이의 `applications` 테이블이 예전 스키마로 남아있어서 500이 났던 문제 — `docker compose down -v && git pull && docker compose up -d --build`로 볼륨 리셋 필요 (실 신청 데이터 없는 것 확인됨). 이후엔 Alembic이 관리하니 다시는 리셋 불필요
- [ ] Google Cloud Console에서 실제 OAuth 2.0 클라이언트 발급 + 리디렉션 URI(`https://study2026.bssm.dev/api/auth/google/callback`) 등록
- [ ] `.env`에 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 실값 채우기 (JWT_SECRET은 이미 생성해서 채움)
- [ ] `ALLOWED_EMAIL_DOMAINS`를 실제 학교 구글 워크스페이스 도메인으로 교체 확인
- [ ] `.env`에 `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER_PHONE` 실값 채우기 (비어있으면 승인은 되지만 문자 발송은 502 실패)
- [ ] CI(lint/test) 파이프라인 여부 결정

## 1. 인증 / 권한
- [x] Google OAuth 로그인/콜백/me/logout 라우터
- [x] 도메인 화이트리스트 + admin 이메일 화이트리스트(`startea0716@gmail.com`) 로직
- [x] 관리자가 다른 참가자의 role(member/admin)을 `/admin`에서 직접 변경 가능 (본인 역할 변경은 막아둠)
- [x] 로그인 상태에 따른 네비게이션 분기 — 헤더에 로그인/로그아웃 버튼, 비로그인 시 "마이페이지"/"관리자" 링크 숨김, 관리자 아니면 "관리자" 링크 숨김
- [ ] 실제 Google 클라이언트로 로그인 플로우 end-to-end 테스트 (0번 OAuth 클라이언트 발급 후 진행)
- [ ] 미허용 도메인 로그인 시 403 에러 페이지/안내 UI (현재 API 403만 응답)
- [ ] JWT 쿠키 `secure=True` 적용 여부 확인 (배포 도메인이 https이므로 켜는 게 맞음)

## 2. 데이터 모델 / 백엔드
- [x] users, sessions, questions, feedbacks, fines, attendances 테이블 모델
- [x] 세션/질문/피드백/벌금/유저 기본 CRUD 라우터
- [x] applications 테이블 + API — 로그인 필요, 필드: 학번/이름/전화번호/공부할 분야(2개 이상)/설명회 참여 가능 시간/개인정보 수집 동의/스터디 규칙 동의
- [x] `study_settings` 테이블(싱글톤) + `GET/PATCH /api/settings` — 참가 신청 기간과 설명회 시간 옵션을 관리자가 `/admin`에서 직접 수정
- [x] SolAPI SMS 연동 — 승인 시 신청자 휴대폰으로 설명회 안내 문자 발송
- [x] Alembic 마이그레이션 (0번 항목 참고)
- [x] attendances API 라우터 — `GET/POST /api/sessions/{id}/attendances`(생성은 admin), `PATCH /api/attendances/{id}`(admin)
- [x] 질문 생성 시 `resolved_before_session_id` 자동 연결 ("다음 발표 전까지 공유" 마감 기준), `PATCH /api/questions/{id}`에 관리자 권한 체크 추가
- [x] `GET /api/questions/mine`, `GET /api/feedbacks/mine` — 로그인한 사용자 본인이 남긴 질문/피드백 조회 (마이페이지용)
- [x] 페이지네이션 — fines/applications/users/questions(unresolved) 목록에 `skip`/`limit`
- [x] 예외 처리 통일 — 전역 핸들러가 처리 안 된 예외도 `{"detail": "서버 오류가 발생했습니다"}` 500 JSON으로 통일 응답
- [x] 발표 날짜 오픈+신청(claim) 구조 — `sessions.presenter_id`/`topic`을 nullable로 변경(마이그레이션 적용됨). 관리자는 `scheduled_date`만 넣어 빈 슬롯 생성(`POST /api/sessions`), `GET /api/sessions/open`으로 미배정 날짜 목록 조회, 승인된 참가자가 `POST /api/sessions/{id}/claim`(주제 입력)으로 자기 발표를 신청. 이미 배정/신청된 슬롯 재신청은 400, 미승인 사용자는 403
- [x] 발표 신청에 관리자 승인 단계 추가 — `sessions.claim_status`(대기/승인, 마이그레이션 `25cd0a46c495`) 신설. `/claim`은 이제 즉시 확정이 아니라 `claim_status='대기'`로만 등록(디스코드 이벤트도 아직 안 만듦). 관리자가 `POST /api/sessions/{id}/approve`로 승인해야 `claim_status='승인'`으로 바뀌면서 디스코드 이벤트 생성+확정 알림 발송, `POST /api/sessions/{id}/reject`로 거절하면 `presenter_id`/`topic`/`claim_status`가 전부 NULL로 리셋되어 슬롯이 다시 열림(`/open`에 재노출). 대기 상태가 아닌 세션에 승인/거절 시도하면 400. `/admin` 일정 목록에 "승인 대기" 뱃지 + 승인/거절 버튼, `/schedule`·`/sessions/:id`·마이페이지에도 대기중이면 뱃지로 구분 표시. Docker curl로 전체 플로우(신청→승인 대기 노출 안 됨→승인→재승인 400→다른 슬롯 거절→재오픈) 확인 + 브라우저로 관리자 승인 클릭 후 뱃지 사라짐/일정표 반영까지 확인 완료
- [x] `GET /api/applications/mine` — 로그인 사용자 본인의 신청 상태 조회 (마이페이지에서 승인 여부 확인용)
- [x] `PATCH /api/sessions/{id}`에 관리자 권한 체크 추가 (이전엔 인증 없이 아무나 세션을 수정할 수 있었던 구멍)
- [ ] applications 승인 시 실제 로그인 권한과 자동 연결되는 로직은 없음 (신청 승인을 로그인 게이트로 쓸 건지 운영 방식 확정 필요)
- [ ] 세션 상태 변경(연기/취소) 시 관련 벌금·질문 처리 정책 결정
- [x] 한 날짜에 발표자 최대 3명 제한(`MAX_PRESENTERS_PER_DATE`, `app/routers/sessions.py`) — `POST /api/sessions`에서 같은 `scheduled_date`의 취소되지 않은 세션 수를 세어 그 이상이면 400. 관리자가 같은 날짜로 슬롯을 최대 3번 열면(각각 별도 row) 학생이 각각 `/claim`으로 신청 — curl로 1~3번째 성공, 4번째 400 확인 (처음엔 2명 제한으로 만들었다가 요청으로 3명으로 상향)
- [x] `calendar_events` 테이블 + API — 발표가 아닌 설명회/공지/회의를 일정표에 추가. `type`(설명회/공지/회의)/`title`/`description`/`event_date` 필드, `GET /api/events`는 공개, `POST/PATCH/DELETE`는 관리자 전용(`app/routers/calendar_events.py`, 마이그레이션 `c40881a681f2`). curl로 CRUD·403 확인 완료
- [x] 일정 이벤트도 디스코드 서버 이벤트로 등록 — `calendar_events.event_time`(선택, 비워두면 `PRESENTATION_TIME` 사용)/`discord_event_id` 추가(마이그레이션 `de4709938a2d`). 생성 시 `discord_events.py`의 `create_calendar_event()`로 이벤트 등록(발표용 `create_scheduled_event()`와 내부 POST 로직 공유), 삭제 시 등록된 이벤트도 같이 정리. 진행 시간은 발표와 동일하게 `PRESENTATION_DURATION_MINUTES` 재사용. 관리자 폼에 "시간(선택)" 입력 추가. Docker로 시간 미지정/지정/잘못된 형식(422) 다 확인, 가짜 토큰으로 실제 디스코드 API에 401까지 도달하는 것도 확인(요청 형식 문제 없음)

## 3. 프론트엔드 페이지
- [x] 라우팅 (`/`, `/apply`, `/schedule`, `/sessions/:id`, `/sessions/:id/questions`, `/fines`, `/members`, `/members/:id`, `/mypage`, `/login`, `/admin`)
- [x] AuthGuard (로그인/관리자 전용 라우트 보호)
- [x] `/apply` — 로그인 필요, 학번/이름/전화번호/분야(2개+)/설명회 가능 시간(관리자 설정 옵션 라디오)/개인정보 동의/규칙 동의, 신청 기간 아니면 안내 문구
- [x] `/admin` — 설정(신청 기간+설명회 옵션+디스코드), 신청 승인/거절+SMS(카드형 UI), 참가자 role 변경, **날짜만 입력하는 발표 슬롯 생성**(같은 날짜 2개까지), 세션 수정/삭제 폼, **설명회/공지/회의 일정 이벤트 CRUD**, **벌금 부과/면제 폼**, **출석 체크 UI** — 전부 관리자 전용 페이지 안에만 존재. 삭제는 확인창(`window.confirm`) 후 실행, 관련 질문/피드백/출석/벌금이 있으면 백엔드가 400으로 막고 "상태를 취소로 바꾸라"고 안내(외래키 제약 위반이 500으로 새는 것 방지), 등록된 디스코드 이벤트도 삭제 시 같이 정리
- [x] `/` 홈 — 스터디 소개 전체 콘텐츠 + 다음 발표 카드 (미배정 슬롯은 "발표자 모집 중"으로 표시)
- [x] `/sessions/:id` — Q&A 탭이 실제 질문 목록+등록 폼으로 동작, 비로그인 시 로그인 안내로 대체
- [x] `/sessions/:id/questions` — 비로그인 시 작성 폼 대신 로그인 안내
- [x] `/fines` — 참가자별로 묶어서 표시 (사용자별 소계 + 개별 내역)
- [x] `/members/:id` — 참가자 상세(역할 뱃지 + 발표 이력)
- [x] `/members` — 참가 신청이 승인된 사용자만 목록에 표시 (`GET /api/users?approved_only=true`, `Application` 테이블과 조인). 관리자 페이지의 역할 변경/벌금/출석 대상 선택은 그대로 전체 사용자 목록 사용 (필터 없이). Docker로 승인/미승인 섞어 넣고 필터링 확인 완료
- [x] `/mypage` — **발표 신청**(참가 신청 승인된 사용자만, 관리자가 열어둔 날짜 중 골라 주제 입력 후 신청) + 발표 일정 + 내가 남긴 질문(해결 여부 뱃지) + 내가 남긴 피드백
- [x] 디자인 시스템 전면 개편 (카드/뱃지/버튼/폼, sticky 네비게이션, 그라디언트, 다크모드)
- [x] 반응형 CSS, 클로징 인용구 박스 `text-wrap: balance`로 줄바꿈 개선
- [x] 전체 프론트엔드 TypeScript 전환, `types.ts` API 타입, `npm run build`가 `tsc --noEmit` 게이트
- [ ] `/apply` 제출 후 이메일 확인 알림 (이메일 발송 인프라 없음 — 필요하면 SolAPI 알림톡/SMS로 대체 검토)
- [x] `/schedule`, 홈 — 발표 세션과 설명회/공지/회의 일정(`calendar_events`)을 날짜순으로 합쳐서 리스트로 표시, 종류별 뱃지 색상 구분 (`EventCard.tsx`, `Schedule.tsx`). 브라우저로 렌더링 확인 완료(같은 날짜 2개 세션 + 이벤트 2개 정상 표시)
- [x] `/schedule`: 캘린더 뷰 — 리스트/캘린더 토글 추가, `CalendarView.tsx`가 월별 그리드로 세션+이벤트를 종류별 색상 칩으로 표시(이전달/다음달/오늘 이동, 오늘 날짜 강조). 세션 칩은 상세 페이지로 링크. 브라우저로 렌더링·월 이동·오늘 버튼·리스트 전환까지 확인 완료
- [x] `/sessions/:id`: 퀴즈 탭 → QuizRunner 실제 연결 — `quiz_json`의 `questions[].{question,options,answer,explanation}` 형식으로 실제 응시 가능(보기 선택 → 제출 → 정답/오답 색상 표시 + 해설 + 채점 결과 + 다시 풀기). `answer` 없는 문항은 서술형으로 표시(채점 제외). 관리자 폼 placeholder/안내문도 갱신. 브라우저로 정답/오답 선택 후 채점·해설·점수 표시까지 확인 완료
- [x] 미해결 질문 목록을 홈 화면에 노출 — `GET /api/questions/unresolved` 최대 5개를 "다음 발표" 카드 밑에 표시, 세션 주제로 링크 연결. 미해결 질문 없으면 섹션 자체를 숨김
- [ ] 로딩/에러 상태 UI (스피너, 공통 에러 메시지 컴포넌트)
- [x] 디스코드 웹훅 알림 — `DISCORD_WEBHOOK_URL` 설정 시 (1) 관리자가 발표 날짜를 열면 "새 날짜 열림" 안내, (2) 학생이 발표를 신청(claim)하면 이름/날짜/주제 안내가 채널에 자동 발송됨. 값 비어있으면 조용히 스킵
- [x] 디스코드 서버 이벤트(Scheduled Event) 자동 등록 — 발표 신청 시 `DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID`/`DISCORD_VOICE_CHANNEL_ID` 설정돼 있으면 지정 음성채널에 연결된 이벤트를 자동 생성(`Session.discord_event_id`에 저장), 세션이 "취소"로 바뀌면 이벤트도 자동 삭제. 날짜만 입력받으므로 시작 시각은 `PRESENTATION_TIME`(기본 21:00) 환경변수로 고정. 봇 발급 절차는 README "디스코드 봇 설정" 참고. 실제 admin/student 토큰으로 생성→신청→취소 전체 플로우 Docker로 검증 완료
- [x] 디스코드 이벤트 설정값(길드ID/음성채널ID/발표 시작 시각/진행 시간) 관리자 페이지 편집 — `study_settings` 테이블에 4개 컬럼 추가(마이그레이션 `6eaf7294f2b4`), `/admin` 설정 폼에 "디스코드 발표 이벤트" 섹션 추가. `.env` 값은 최초 기본값으로만 쓰이고 이후엔 DB 값이 우선(`discord_events.py`가 `.env` → DB 순으로 폴백). 봇 토큰만 비밀값이라 계속 `.env` 전용. `PATCH /api/settings`에 `presentation_time` HH:MM 형식 검증 추가, admin 권한/유효성 검사 curl로 확인 완료
- [x] 디스코드 봇을 서버 기동 시 함께 접속시켜 "온라인" 표시 — `app/discord_bot.py`가 FastAPI `lifespan`에서 `DISCORD_BOT_TOKEN` 있으면 백그라운드 asyncio task로 게이트웨이 접속(별도 컨테이너 불필요), 앱 종료 시 정상 종료. 토큰 없음/잘못됨 모두 예외를 잡아 서버 기동·API 동작에 영향 없음을 Docker로 확인(정상 케이스/토큰 없음/토큰 오류 3가지 다 헬스체크 통과). 이벤트 생성/삭제(REST)는 이 게이트웨이 접속과 무관하게 항상 독립적으로 동작
- [x] 세션 날짜/주제 수정 시 등록된 디스코드 이벤트도 동기화 — `discord_events.py`에 `update_scheduled_event()` 추가(디스코드 PATCH 이벤트 API), `PATCH /api/sessions/{id}`에서 `scheduled_date`나 `topic`이 바뀌고 `discord_event_id`가 있으면 자동 호출. 관련 없는 필드(예: `material_url`)만 바뀔 때는 호출 안 함. Docker로 두 경우 다 로그로 확인(주제 변경 시에만 디스코드 API 호출 시도)
- [x] 발표 전날 디스코드 리마인더 — `app/reminders.py`가 FastAPI `lifespan`에서 백그라운드 asyncio 루프로 매일 KST 09:00에 "내일 예정 + 승인 확정된" 세션을 조회해서 발표자/주제를 디스코드 웹훅으로 안내. 별도 스케줄러 라이브러리 없이 `asyncio.sleep`으로 다음 09:00까지 대기하는 방식. `DISCORD_WEBHOOK_URL` 미설정 시 조용히 스킵. Docker에서 내일 날짜의 승인된 세션을 심어두고 리마인더 함수를 직접 실행해 쿼리·웹훅 호출까지 확인 완료

## 4. 비기능 요구사항
- [x] 반응형 스타일
- [x] 질문 작성이 로그인 사용자만 가능하다는 걸 프론트에서도 방어 (QuestionBoard/Q&A 탭 모두 비로그인 시 폼 대신 안내)
- [x] 관리자만 벌금 부과/일정 조정 가능 — 해당 폼들이 `/admin`(AuthGuard adminOnly) 안에만 존재해서 구조적으로 보장됨

## 5. 테스트
- [ ] 백엔드 API 테스트 (pytest) — 도메인/admin 화이트리스트, applications 검증 로직, 신청 기간 제한
- [ ] 프론트 주요 플로우 수동 QA (로그인 → 참가 신청 → 관리자 승인 → SMS 수신 → 세션 질문 등록 → 출석/벌금 관리)
