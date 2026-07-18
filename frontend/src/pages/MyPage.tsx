import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import type { Application, Feedback, Question, StudySession, UserDetail } from "../types";

export default function MyPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [openSessions, setOpenSessions] = useState<StudySession[]>([]);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimTopic, setClaimTopic] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claiming, setClaiming] = useState(false);

  const loadSessions = () => {
    if (!user) return;
    client.get<UserDetail>(`/users/${user.id}`).then(({ data }) => setSessions(data.sessions));
    client.get<StudySession[]>("/sessions").then(({ data }) => setAllSessions(data));
  };

  const loadOpenSessions = () => {
    client.get<StudySession[]>("/sessions/open").then(({ data }) => setOpenSessions(data));
  };

  useEffect(() => {
    if (!user) return;
    loadSessions();
    loadOpenSessions();
    client.get<Question[]>("/questions/mine").then(({ data }) => setQuestions(data));
    client.get<Feedback[]>("/feedbacks/mine").then(({ data }) => setFeedbacks(data));
    client.get<Application | null>("/applications/mine").then(({ data }) => setMyApplication(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sessionTopic = (sessionId: number) =>
    allSessions.find((s) => s.id === sessionId)?.topic ?? `세션 #${sessionId}`;

  const startClaim = (sessionId: number) => {
    setClaimingId(sessionId);
    setClaimTopic("");
    setClaimError("");
  };

  const confirmClaim = async (sessionId: number) => {
    setClaimError("");
    if (!claimTopic.trim()) {
      setClaimError("발표 주제를 입력하세요.");
      return;
    }
    setClaiming(true);
    try {
      await client.post(`/sessions/${sessionId}/claim`, { topic: claimTopic.trim() });
      setClaimingId(null);
      loadOpenSessions();
      loadSessions();
    } catch (err: any) {
      setClaimError(err.response?.data?.detail ?? "발표 신청에 실패했습니다.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <section>
      <h1>마이페이지</h1>
      <p>{user?.name}</p>

      <h2>발표 신청</h2>
      {myApplication?.status === "승인" ? (
        openSessions.length === 0 ? (
          <p>현재 신청 가능한 날짜가 없습니다.</p>
        ) : (
          <ul>
            {openSessions.map((s) => (
              <li key={s.id}>
                <strong>{s.scheduled_date}</strong>
                {claimingId !== s.id && <button onClick={() => startClaim(s.id)}>이 날짜에 신청</button>}
                {claimingId === s.id && (
                  <div className="approve-form">
                    <label>
                      발표 주제
                      <input
                        value={claimTopic}
                        onChange={(e) => setClaimTopic(e.target.value)}
                        placeholder="예: 리눅스 기초"
                      />
                    </label>
                    <button onClick={() => confirmClaim(s.id)} disabled={claiming}>
                      {claiming ? "신청 중..." : "신청 확정"}
                    </button>
                    <button onClick={() => setClaimingId(null)}>취소</button>
                    {claimError && <p className="approve-form__error">{claimError}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : myApplication ? (
        <p className="note">
          참가 신청이 아직 "{myApplication.status}" 상태입니다. 승인되면 발표 날짜를 신청할 수 있습니다.
        </p>
      ) : (
        <p className="note">
          참가 신청 후 승인되면 발표 날짜를 신청할 수 있습니다. <Link to="/apply">참가 신청하러 가기</Link>
        </p>
      )}

      <h2>내 발표 일정</h2>
      {sessions.length === 0 ? (
        <p>발표 예정인 세션이 없습니다.</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {session.scheduled_date} — {session.topic}{" "}
              {session.claim_status === "대기" && <span className="badge badge--pending">승인 대기</span>}
              {session.claim_status === "승인" && <span className="badge badge--approved">확정</span>}
            </li>
          ))}
        </ul>
      )}

      <h2>내가 남긴 질문</h2>
      {questions.length === 0 ? (
        <p>아직 남긴 질문이 없습니다.</p>
      ) : (
        <ul>
          {questions.map((q) => (
            <li key={q.id}>
              <Link to={`/sessions/${q.session_id}/questions`}>{sessionTopic(q.session_id)}</Link>
              <p>{q.content}</p>
              <span className={`badge ${q.resolved ? "badge--approved" : "badge--warning"}`}>
                {q.resolved ? "해결됨" : "미해결"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2>내가 남긴 피드백</h2>
      {feedbacks.length === 0 ? (
        <p>아직 남긴 피드백이 없습니다.</p>
      ) : (
        <ul>
          {feedbacks.map((f) => (
            <li key={f.id}>
              <Link to={`/sessions/${f.session_id}`}>{sessionTopic(f.session_id)}</Link>
              <p>{f.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
