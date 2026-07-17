import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import type {
  Application,
  Attendance,
  AttendanceStatus,
  Fine,
  FineReason,
  StudySession,
  SessionStatus,
  StudySettings,
  User,
  UserRole,
} from "../types";

interface SettingsForm {
  opensAt: string;
  closesAt: string;
  options: string[];
}

interface SessionForm {
  presenter_id: string;
  topic: string;
  scheduled_date: string;
  material_url: string;
}

interface EditSessionForm {
  status: SessionStatus;
  material_url: string;
  concept_note: string;
  example_note: string;
  demo_note: string;
  summary_note: string;
  quiz_json: string;
}

interface FineForm {
  user_id: string;
  session_id: string;
  reason: FineReason;
  exempted: boolean;
}

const toDatetimeLocal = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

const FINE_REASONS: FineReason[] = ["무단불참", "자료미준비", "무단지각", "당일취소", "기타"];
const SESSION_STATUSES: SessionStatus[] = ["예정", "완료", "연기", "취소"];
const ATTENDANCE_STATUSES: AttendanceStatus[] = ["출석", "지각", "불참"];

export default function Admin() {
  const currentUser = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [orientationAt, setOrientationAt] = useState("");
  const [orientationPlace, setOrientationPlace] = useState("");
  const [approveError, setApproveError] = useState("");

  const [settingsForm, setSettingsForm] = useState<SettingsForm>({ opensAt: "", closesAt: "", options: [""] });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [sessionForm, setSessionForm] = useState<SessionForm>({
    presenter_id: "",
    topic: "",
    scheduled_date: "",
    material_url: "",
  });
  const [sessionCreating, setSessionCreating] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editSessionForm, setEditSessionForm] = useState<EditSessionForm>({
    status: "예정",
    material_url: "",
    concept_note: "",
    example_note: "",
    demo_note: "",
    summary_note: "",
    quiz_json: "",
  });
  const [editSessionError, setEditSessionError] = useState("");

  const [fineForm, setFineForm] = useState<FineForm>({
    user_id: "",
    session_id: "",
    reason: "무단불참",
    exempted: false,
  });
  const [fineCreating, setFineCreating] = useState(false);

  const [attendanceSessionId, setAttendanceSessionId] = useState("");
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<number, AttendanceStatus>>({});

  const loadSessions = () => {
    client.get<StudySession[]>("/sessions").then(({ data }) => setSessions(data));
  };

  const loadFines = () => {
    client.get<Fine[]>("/fines").then(({ data }) => setFines(data));
  };

  const loadApplications = () => {
    client.get<Application[]>("/applications").then(({ data }) => setApplications(data));
  };

  const loadUsers = () => {
    client.get<User[]>("/users").then(({ data }) => setUsers(data));
  };

  const loadSettings = () => {
    client.get<StudySettings>("/settings").then(({ data }) => {
      setSettingsForm({
        opensAt: toDatetimeLocal(data.application_opens_at),
        closesAt: toDatetimeLocal(data.application_closes_at),
        options: data.orientation_options.length > 0 ? data.orientation_options : [""],
      });
    });
  };

  const loadAttendances = () => {
    if (!attendanceSessionId) {
      setAttendances([]);
      return;
    }
    client.get<Attendance[]>(`/sessions/${attendanceSessionId}/attendances`).then(({ data }) => setAttendances(data));
  };

  useEffect(() => {
    loadSessions();
    loadFines();
    loadApplications();
    loadUsers();
    loadSettings();
  }, []);

  useEffect(() => {
    setAttendanceDrafts({});
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceSessionId]);

  const changeRole = async (userId: number, role: UserRole) => {
    await client.patch(`/users/${userId}`, { role });
    loadUsers();
  };

  const updateOption = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    setSettingsForm((f) => {
      const options = [...f.options];
      options[index] = e.target.value;
      return { ...f, options };
    });
  };

  const addOption = () => setSettingsForm((f) => ({ ...f, options: [...f.options, ""] }));

  const removeOption = (index: number) =>
    setSettingsForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      await client.patch("/settings", {
        application_opens_at: settingsForm.opensAt || null,
        application_closes_at: settingsForm.closesAt || null,
        orientation_options: settingsForm.options.map((o) => o.trim()).filter(Boolean),
      });
      setSettingsSaved(true);
      loadSettings();
    } finally {
      setSettingsSaving(false);
    }
  };

  const startApprove = (application: Application) => {
    setApprovingId(application.id);
    setOrientationAt("");
    setOrientationPlace("");
    setApproveError("");
  };

  const confirmApprove = async (id: number) => {
    setApproveError("");
    try {
      await client.patch(`/applications/${id}`, {
        status: "승인",
        orientation_at: orientationAt || null,
        orientation_place: orientationPlace || null,
      });
      setApprovingId(null);
      loadApplications();
    } catch (err: any) {
      setApproveError(err.response?.data?.detail ?? "승인 처리 중 오류가 발생했습니다.");
      loadApplications();
    }
  };

  const reject = async (id: number) => {
    await client.patch(`/applications/${id}`, { status: "거절" });
    loadApplications();
  };

  const createSession = async (e: FormEvent) => {
    e.preventDefault();
    setSessionError("");
    if (!sessionForm.presenter_id || !sessionForm.topic.trim() || !sessionForm.scheduled_date) {
      setSessionError("발표자/주제/날짜를 모두 입력하세요.");
      return;
    }
    setSessionCreating(true);
    try {
      await client.post("/sessions", {
        presenter_id: Number(sessionForm.presenter_id),
        topic: sessionForm.topic.trim(),
        scheduled_date: sessionForm.scheduled_date,
        material_url: sessionForm.material_url.trim() || null,
      });
      setSessionForm({ presenter_id: "", topic: "", scheduled_date: "", material_url: "" });
      loadSessions();
    } catch (err: any) {
      setSessionError(err.response?.data?.detail ?? "세션 생성에 실패했습니다.");
    } finally {
      setSessionCreating(false);
    }
  };

  const startEditSession = (session: StudySession) => {
    setEditingSessionId(session.id);
    setEditSessionForm({
      status: session.status,
      material_url: session.material_url ?? "",
      concept_note: session.concept_note ?? "",
      example_note: session.example_note ?? "",
      demo_note: session.demo_note ?? "",
      summary_note: session.summary_note ?? "",
      quiz_json: session.quiz_json ? JSON.stringify(session.quiz_json, null, 2) : "",
    });
    setEditSessionError("");
  };

  const saveSessionEdit = async (id: number) => {
    setEditSessionError("");
    let quizPayload: unknown = null;
    if (editSessionForm.quiz_json.trim()) {
      try {
        quizPayload = JSON.parse(editSessionForm.quiz_json);
      } catch {
        setEditSessionError("퀴즈 JSON 형식이 올바르지 않습니다.");
        return;
      }
    }
    try {
      await client.patch(`/sessions/${id}`, {
        status: editSessionForm.status,
        material_url: editSessionForm.material_url.trim() || null,
        concept_note: editSessionForm.concept_note.trim() || null,
        example_note: editSessionForm.example_note.trim() || null,
        demo_note: editSessionForm.demo_note.trim() || null,
        summary_note: editSessionForm.summary_note.trim() || null,
        quiz_json: quizPayload,
      });
      setEditingSessionId(null);
      loadSessions();
    } catch (err: any) {
      setEditSessionError(err.response?.data?.detail ?? "저장에 실패했습니다.");
    }
  };

  const createFine = async (e: FormEvent) => {
    e.preventDefault();
    if (!fineForm.user_id) return;
    setFineCreating(true);
    try {
      await client.post("/fines", {
        user_id: Number(fineForm.user_id),
        session_id: fineForm.session_id ? Number(fineForm.session_id) : null,
        reason: fineForm.reason,
        exempted: fineForm.exempted,
      });
      setFineForm({ user_id: "", session_id: "", reason: "무단불참", exempted: false });
      loadFines();
    } finally {
      setFineCreating(false);
    }
  };

  const exemptFine = async (id: number) => {
    await client.patch(`/fines/${id}`, { exempted: true });
    loadFines();
  };

  const saveAttendance = async (userId: number, existing: Attendance | undefined) => {
    const status = attendanceDrafts[userId] ?? existing?.status ?? "출석";
    if (existing) {
      await client.patch(`/attendances/${existing.id}`, { status });
    } else {
      await client.post(`/sessions/${attendanceSessionId}/attendances`, { user_id: userId, status });
    }
    loadAttendances();
  };

  return (
    <section>
      <h1>관리자</h1>

      <h2>설정</h2>
      <form onSubmit={saveSettings}>
        <label>
          참가 신청 시작
          <input
            type="datetime-local"
            value={settingsForm.opensAt}
            onChange={(e) => setSettingsForm((f) => ({ ...f, opensAt: e.target.value }))}
          />
        </label>
        <label>
          참가 신청 마감
          <input
            type="datetime-local"
            value={settingsForm.closesAt}
            onChange={(e) => setSettingsForm((f) => ({ ...f, closesAt: e.target.value }))}
          />
        </label>

        <div>
          <label>설명회 참여 가능 시간 옵션 (신청자가 이 중에서 라디오로 선택)</label>
          {settingsForm.options.map((option, i) => (
            <div key={i} className="topic-row">
              <input value={option} onChange={updateOption(i)} placeholder="예: 7월 20일(월) 오후 9시" />
              {settingsForm.options.length > 1 && (
                <button type="button" onClick={() => removeOption(i)}>
                  삭제
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption}>
            옵션 추가
          </button>
        </div>

        <button type="submit" disabled={settingsSaving}>
          {settingsSaving ? "저장 중..." : "설정 저장"}
        </button>
        {settingsSaved && <p className="note">저장되었습니다.</p>}
      </form>

      <h2>참가 신청 관리</h2>
      <ul>
        {applications.map((a) => (
          <li key={a.id}>
            <strong>{a.name}</strong> ({a.student_id} / {a.user.email} / {a.phone}){" "}
            <span
              className={`badge ${
                a.status === "승인" ? "badge--approved" : a.status === "거절" ? "badge--rejected" : "badge--pending"
              }`}
            >
              {a.status}
            </span>
            <p>분야: {a.topics.join(", ")}</p>
            <p>설명회 참여 가능 시간: {a.available_time}</p>
            {a.status === "승인" && (
              <p>
                설명회: {a.orientation_at ? new Date(a.orientation_at).toLocaleString() : "미정"} /{" "}
                {a.orientation_place || "미정"} — 문자 발송 {a.sms_sent ? "완료" : "실패/미발송"}
              </p>
            )}

            {a.status === "대기" && approvingId !== a.id && (
              <>
                <button onClick={() => startApprove(a)}>승인</button>
                <button onClick={() => reject(a.id)}>거절</button>
              </>
            )}

            {approvingId === a.id && (
              <div className="approve-form">
                <label>
                  설명회 일시
                  <input
                    type="datetime-local"
                    value={orientationAt}
                    onChange={(e) => setOrientationAt(e.target.value)}
                  />
                </label>
                <label>
                  설명회 장소
                  <input
                    value={orientationPlace}
                    onChange={(e) => setOrientationPlace(e.target.value)}
                    placeholder="예: 학교 2층 세미나실"
                  />
                </label>
                <button onClick={() => confirmApprove(a.id)}>승인 확정 + 문자 발송</button>
                <button onClick={() => setApprovingId(null)}>취소</button>
                {approveError && <p className="approve-form__error">{approveError}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2>참가자 관리</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <strong>{u.name}</strong> ({u.email}){" "}
            <span className={`badge ${u.role === "admin" ? "badge--admin" : "badge--member"}`}>
              {u.role === "admin" ? "관리자" : "일반"}
            </span>
            <select
              className="role-select"
              value={u.role}
              disabled={u.id === currentUser?.id}
              onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
            >
              <option value="member">일반</option>
              <option value="admin">관리자</option>
            </select>
          </li>
        ))}
      </ul>
      <p className="note">본인 역할은 변경할 수 없습니다.</p>

      <h2>일정 관리</h2>
      <form onSubmit={createSession}>
        <label>
          발표자
          <select
            value={sessionForm.presenter_id}
            onChange={(e) => setSessionForm((f) => ({ ...f, presenter_id: e.target.value }))}
          >
            <option value="">선택</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          주제
          <input
            value={sessionForm.topic}
            onChange={(e) => setSessionForm((f) => ({ ...f, topic: e.target.value }))}
            placeholder="예: 리눅스 기초"
          />
        </label>
        <label>
          발표 날짜
          <input
            type="date"
            value={sessionForm.scheduled_date}
            onChange={(e) => setSessionForm((f) => ({ ...f, scheduled_date: e.target.value }))}
          />
        </label>
        <label>
          자료 링크 (선택)
          <input
            value={sessionForm.material_url}
            onChange={(e) => setSessionForm((f) => ({ ...f, material_url: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        {sessionError && <p className="apply__error">{sessionError}</p>}
        <button type="submit" disabled={sessionCreating}>
          {sessionCreating ? "추가 중..." : "세션 추가"}
        </button>
      </form>

      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            <strong>{s.scheduled_date}</strong> — {s.topic} <span className="badge">{s.status}</span>
            {editingSessionId !== s.id && <button onClick={() => startEditSession(s)}>수정</button>}

            {editingSessionId === s.id && (
              <div className="approve-form">
                <label>
                  상태
                  <select
                    value={editSessionForm.status}
                    onChange={(e) =>
                      setEditSessionForm((f) => ({ ...f, status: e.target.value as SessionStatus }))
                    }
                  >
                    {SESSION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  자료 링크
                  <input
                    value={editSessionForm.material_url}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, material_url: e.target.value }))}
                  />
                </label>
                <label>
                  개념
                  <textarea
                    value={editSessionForm.concept_note}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, concept_note: e.target.value }))}
                  />
                </label>
                <label>
                  실제 사용 예시
                  <textarea
                    value={editSessionForm.example_note}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, example_note: e.target.value }))}
                  />
                </label>
                <label>
                  시연/실습
                  <textarea
                    value={editSessionForm.demo_note}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, demo_note: e.target.value }))}
                  />
                </label>
                <label>
                  정리
                  <textarea
                    value={editSessionForm.summary_note}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, summary_note: e.target.value }))}
                  />
                </label>
                <label>
                  퀴즈 (JSON, 선택)
                  <textarea
                    value={editSessionForm.quiz_json}
                    onChange={(e) => setEditSessionForm((f) => ({ ...f, quiz_json: e.target.value }))}
                    placeholder='{"questions": [{"question": "...", "options": ["..."]}]}'
                  />
                </label>
                <button onClick={() => saveSessionEdit(s.id)}>저장</button>
                <button onClick={() => setEditingSessionId(null)}>취소</button>
                {editSessionError && <p className="approve-form__error">{editSessionError}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2>벌금 부과/면제</h2>
      <form onSubmit={createFine}>
        <label>
          참가자
          <select
            value={fineForm.user_id}
            onChange={(e) => setFineForm((f) => ({ ...f, user_id: e.target.value }))}
          >
            <option value="">선택</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          관련 세션 (선택)
          <select
            value={fineForm.session_id}
            onChange={(e) => setFineForm((f) => ({ ...f, session_id: e.target.value }))}
          >
            <option value="">없음</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.scheduled_date} — {s.topic}
              </option>
            ))}
          </select>
        </label>
        <label>
          사유
          <select
            value={fineForm.reason}
            onChange={(e) => setFineForm((f) => ({ ...f, reason: e.target.value as FineReason }))}
          >
            {FINE_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={fineForm.exempted}
            onChange={(e) => setFineForm((f) => ({ ...f, exempted: e.target.checked }))}
          />
          <span>면제 처리 (사전 연락/부상·질병 등)</span>
        </label>
        <button type="submit" disabled={fineCreating}>
          {fineCreating ? "부과 중..." : "벌금 부과"}
        </button>
      </form>

      <ul>
        {fines.map((f) => {
          const user = users.find((u) => u.id === f.user_id);
          return (
            <li key={f.id}>
              {user?.name ?? `참가자 #${f.user_id}`} — {f.reason} — {f.amount}원{" "}
              <span className={`badge ${f.exempted ? "badge--approved" : "badge--pending"}`}>
                {f.exempted ? "면제" : "미면제"}
              </span>
              {!f.exempted && <button onClick={() => exemptFine(f.id)}>면제 처리</button>}
            </li>
          );
        })}
      </ul>

      <h2>출석 체크</h2>
      <label>
        세션 선택
        <select value={attendanceSessionId} onChange={(e) => setAttendanceSessionId(e.target.value)}>
          <option value="">선택</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.scheduled_date} — {s.topic}
            </option>
          ))}
        </select>
      </label>

      {attendanceSessionId && (
        <ul>
          {users.map((u) => {
            const record = attendances.find((a) => a.user_id === u.id);
            const draft = attendanceDrafts[u.id] ?? record?.status ?? "출석";
            return (
              <li key={u.id}>
                {u.name}{" "}
                <select
                  className="role-select"
                  value={draft}
                  onChange={(e) =>
                    setAttendanceDrafts((d) => ({ ...d, [u.id]: e.target.value as AttendanceStatus }))
                  }
                >
                  {ATTENDANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button onClick={() => saveAttendance(u.id, record)}>저장</button>
                {record && <span className="note"> 기록됨: {record.status}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
