# 여름방학 회고 스터디 웹사이트 명세서

## 0. 개요
| 항목 | 내용 |
| --- | --- |
| 프로젝트명 | 여름방학 회고 스터디 |
| 사이트명 | study2026 (2026년 한정, 내년 재개편 시 명칭 변경 필요) |
| 도메인 | study2026.bssm.dev |
| 목적 | 스터디 운영(발표 일정, 자료 공유, 질문/피드백, 벌금 관리) 전산화 |
| 프론트엔드 | React (Vite) |
| 백엔드 | FastAPI |
| DB | MySQL |
| 배포 | Docker Compose + Cloudflare Tunnel (기존 인프라 재사용) |
| 인증 | Google OAuth 2.0 (학교 구글 계정만 허용) |

---

## 1. 도메인 규칙 요약 (기획서 → 시스템 반영)

- 참가자는 **발표자(presenter) / 청취자(listener)** 역할을 세션마다 가짐 (고정 역할 아님 — 한 명이 돌아가며 발표자가 됨)
- 스터디는 **3일 공부 → 발표 → 피드백** 사이클, 발표는 하루에 1명
- 발표 구성: 개념 / 실사용 예시 / 시연·실습 / Q&A / 퀴즈·정리
- 질문에 즉답 못하면 **다음 발표 전까지 함께 조사 후 공유** (미해결 질문 트래킹 필요)
- 벌금 규정 (금액 고정 500원, 무벌금 사유 존재)
- 벌금은 회식비로 적립

---

## 2. 페이지 구성 (React Router)

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | 홈 | 스터디 소개, 다음 발표자/일정 안내 |
| `/schedule` | 일정표 | 발표 날짜별 담당자·분야 캘린더/리스트 |
| `/sessions/:id` | 발표 상세 | 개념/예시/실습/Q&A/퀴즈 자료 링크, 발표자료 첨부 |
| `/sessions/:id/questions` | 질문 게시판 | 해당 세션 질문 목록 (해결/미해결 상태) |
| `/fines` | 벌금 현황 | 참가자별 누적 벌금, 사유, 회식비 총액 |
| `/members` | 참가자 목록 | 담당 분야, 발표 이력 |
| `/mypage` | 마이페이지 | 내 발표 일정, 내가 남긴 질문/피드백 |
| `/login` | 인증 | 구글 로그인 버튼만 존재 (별도 회원가입 없음, 최초 로그인 시 자동 가입) |
| `/admin` | 관리자(스터디장) | 일정 조정, 벌금 부과/면제, 참가자 관리 |

---

## 3. 데이터 모델 (MySQL)

### users
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| name | varchar | 구글 프로필 이름 |
| email | varchar, unique | 학교 구글 계정 이메일 (도메인 화이트리스트 검증) |
| google_sub | varchar, unique | 구글 OAuth 고유 ID |
| profile_image_url | varchar | 구글 프로필 사진 |
| role | enum('member','admin') | 기본값 member, 어드민 이메일만 admin 자동 부여 |
| created_at | datetime | |

### sessions (발표 세션)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| presenter_id | FK → users | 발표자 |
| topic | varchar | 분야명 (알고리즘, 리눅스 등) |
| scheduled_date | date | 발표일 |
| status | enum('예정','완료','취소','연기') | |
| material_url | varchar | 노션/PDF/PPT/벨로그 링크 |
| concept_note | text | 개념 정리 |
| example_note | text | 실사용 예시 |
| demo_note | text | 시연/실습 내용 |
| summary_note | text | 정리 |
| quiz_json | json | 퀴즈 문항 |
| created_at | datetime | |

### questions (질문)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| session_id | FK → sessions | |
| author_id | FK → users | |
| content | text | |
| answered | boolean | 즉답 여부 |
| resolved | boolean | 최종 해결 여부 |
| answer_note | text | 조사 후 공유된 답변 |
| resolved_before_session_id | FK → sessions (nullable) | "다음 발표 전 공유" 추적용 |
| created_at | datetime | |

### feedbacks (피드백)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| session_id | FK → sessions | |
| author_id | FK → users | |
| content | text | |
| created_at | datetime | |

### fines (벌금)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| user_id | FK → users | |
| session_id | FK → sessions (nullable) | |
| reason | enum('무단불참','자료미준비','무단지각','당일취소','기타') | |
| amount | int | 기본 500, 면제 시 0 |
| exempted | boolean | 사전연락/부상·질병 등 면제 여부 |
| created_at | datetime | |

### attendances (참석 기록, 선택)
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | |
| session_id | FK | |
| user_id | FK | |
| status | enum('출석','지각','불참') | |
| checked_at | datetime | |

---

## 4. API 명세 (FastAPI)

### 인증 (Google OAuth 2.0)
- `GET /api/auth/google/login` — 구글 로그인 페이지로 리다이렉트
- `GET /api/auth/google/callback` — 구글 콜백 처리, 이메일 도메인 검증 후 자체 JWT 발급 (실패 시 403)
- `GET /api/auth/me`
- `POST /api/auth/logout`

**도메인/어드민 검증 로직**
- 로그인 허용 이메일: 학교 구글 계정 도메인만 통과 (허용 도메인 화이트리스트를 환경변수로 관리)
- 어드민 지정: `startea0716@gmail.com`은 예외적으로 개인 계정이지만 관리자 이메일 화이트리스트에 등록되어 `role=admin` 자동 부여

### 세션(발표)
- `GET /api/sessions` — 전체 일정 조회 (필터: 날짜, 담당자, 상태)
- `POST /api/sessions` — 세션 생성 (관리자)
- `GET /api/sessions/{id}` — 상세 조회
- `PATCH /api/sessions/{id}` — 발표자료/노트/상태 수정
- `DELETE /api/sessions/{id}` — 삭제(관리자)

### 질문
- `GET /api/sessions/{id}/questions`
- `POST /api/sessions/{id}/questions`
- `PATCH /api/questions/{id}` — 답변 등록/해결 처리
- `GET /api/questions/unresolved` — 미해결 질문 전체 (다음 발표 전 공유용)

### 피드백
- `GET /api/sessions/{id}/feedbacks`
- `POST /api/sessions/{id}/feedbacks`

### 벌금
- `GET /api/fines` — 전체/사용자별 조회
- `POST /api/fines` — 벌금 부과(관리자)
- `PATCH /api/fines/{id}` — 면제 처리
- `GET /api/fines/summary` — 참가자별 누적 + 회식비 총액

### 참가자
- `GET /api/users`
- `GET /api/users/{id}` — 발표 이력 포함

---

## 5. 프론트엔드 컴포넌트 구조 (예시)

```
src/
├─ pages/
│  ├─ Home.jsx
│  ├─ Schedule.jsx
│  ├─ SessionDetail.jsx
│  ├─ QuestionBoard.jsx
│  ├─ Fines.jsx
│  ├─ Members.jsx
│  ├─ MyPage.jsx
│  ├─ Login.jsx               # 구글 로그인 버튼
│  └─ Admin.jsx
├─ components/
│  ├─ ScheduleCard.jsx
│  ├─ SessionTabs.jsx        # 개념/예시/실습/Q&A/퀴즈 탭
│  ├─ QuestionItem.jsx
│  ├─ FineTable.jsx
│  ├─ QuizRunner.jsx
│  └─ AuthGuard.jsx
├─ api/
│  └─ client.js              # axios/fetch 래퍼
├─ store/                    # 전역 상태 (Zustand 등)
└─ App.jsx
```

---

## 6. 비기능 요구사항
- 로그인은 구글 OAuth만 지원 (자체 회원가입/비밀번호 없음)
- 학교 구글 계정 도메인이 아닌 계정은 로그인 거부 (단, 어드민 화이트리스트 이메일은 예외 허용)
- 발표 자료는 외부 링크(노션/PDF/PPT/벨로그)만 저장, 파일 업로드는 선택 사항
- 관리자(스터디장)만 벌금 부과/면제, 일정 조정 가능
- 질문은 로그인 사용자만 작성 가능, 미해결 질문은 대시보드에 상단 노출
- 모바일 대응 (디스코드 병행 사용 고려해 반응형 최소 지원)

---

## 7. 배포
- `docker-compose.yml`: frontend(React 정적 빌드+nginx), backend(FastAPI+uvicorn), mysql
- Cloudflare Tunnel로 study2026.bssm.dev 도메인 연결하여 외부 노출