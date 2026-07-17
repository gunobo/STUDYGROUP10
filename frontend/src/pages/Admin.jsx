import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : "");

export default function Admin() {
  const currentUser = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [fines, setFines] = useState([]);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [orientationAt, setOrientationAt] = useState("");
  const [orientationPlace, setOrientationPlace] = useState("");
  const [approveError, setApproveError] = useState("");

  const [settingsForm, setSettingsForm] = useState({ opensAt: "", closesAt: "", options: [""] });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadApplications = () => {
    client.get("/applications").then(({ data }) => setApplications(data));
  };

  const loadUsers = () => {
    client.get("/users").then(({ data }) => setUsers(data));
  };

  const loadSettings = () => {
    client.get("/settings").then(({ data }) => {
      setSettingsForm({
        opensAt: toDatetimeLocal(data.application_opens_at),
        closesAt: toDatetimeLocal(data.application_closes_at),
        options: data.orientation_options.length > 0 ? data.orientation_options : [""],
      });
    });
  };

  useEffect(() => {
    client.get("/sessions").then(({ data }) => setSessions(data));
    client.get("/fines").then(({ data }) => setFines(data));
    loadApplications();
    loadUsers();
    loadSettings();
  }, []);

  const changeRole = async (userId, role) => {
    await client.patch(`/users/${userId}`, { role });
    loadUsers();
  };

  const updateOption = (index) => (e) => {
    setSettingsForm((f) => {
      const options = [...f.options];
      options[index] = e.target.value;
      return { ...f, options };
    });
  };

  const addOption = () => setSettingsForm((f) => ({ ...f, options: [...f.options, ""] }));

  const removeOption = (index) =>
    setSettingsForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));

  const saveSettings = async (e) => {
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

  const startApprove = (application) => {
    setApprovingId(application.id);
    setOrientationAt("");
    setOrientationPlace("");
    setApproveError("");
  };

  const confirmApprove = async (id) => {
    setApproveError("");
    try {
      await client.patch(`/applications/${id}`, {
        status: "승인",
        orientation_at: orientationAt || null,
        orientation_place: orientationPlace || null,
      });
      setApprovingId(null);
      loadApplications();
    } catch (err) {
      setApproveError(err.response?.data?.detail ?? "승인 처리 중 오류가 발생했습니다.");
      loadApplications();
    }
  };

  const reject = async (id) => {
    await client.patch(`/applications/${id}`, { status: "거절" });
    loadApplications();
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
              <input
                value={option}
                onChange={updateOption(i)}
                placeholder="예: 7월 20일(월) 오후 9시"
              />
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
              onChange={(e) => changeRole(u.id, e.target.value)}
            >
              <option value="member">일반</option>
              <option value="admin">관리자</option>
            </select>
          </li>
        ))}
      </ul>
      <p className="note">본인 역할은 변경할 수 없습니다.</p>

      <h2>일정 관리</h2>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            {s.scheduled_date} — {s.topic} ({s.status})
          </li>
        ))}
      </ul>
      <h2>벌금 부과/면제</h2>
      <ul>
        {fines.map((f) => (
          <li key={f.id}>
            {f.reason} — {f.amount}원 {f.exempted ? "(면제)" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
