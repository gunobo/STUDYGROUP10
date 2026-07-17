import { useEffect, useState } from "react";
import client from "../api/client";

export default function Admin() {
  const [sessions, setSessions] = useState([]);
  const [fines, setFines] = useState([]);
  const [applications, setApplications] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [orientationAt, setOrientationAt] = useState("");
  const [orientationPlace, setOrientationPlace] = useState("");
  const [approveError, setApproveError] = useState("");

  const loadApplications = () => {
    client.get("/applications").then(({ data }) => setApplications(data));
  };

  useEffect(() => {
    client.get("/sessions").then(({ data }) => setSessions(data));
    client.get("/fines").then(({ data }) => setFines(data));
    loadApplications();
  }, []);

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

      <h2>참가 신청 관리</h2>
      <ul>
        {applications.map((a) => (
          <li key={a.id}>
            <strong>{a.name}</strong> ({a.email} / {a.phone || "연락처 없음"}){" "}
            <span
              className={`badge ${
                a.status === "승인" ? "badge--approved" : a.status === "거절" ? "badge--rejected" : "badge--pending"
              }`}
            >
              {a.status}
            </span>
            <p>{a.motivation}</p>
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
