import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import type { Feedback, Question, StudySession, UserDetail } from "../types";

export default function MyPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    if (!user) return;
    client.get<UserDetail>(`/users/${user.id}`).then(({ data }) => setSessions(data.sessions));
    client.get<StudySession[]>("/sessions").then(({ data }) => setAllSessions(data));
    client.get<Question[]>("/questions/mine").then(({ data }) => setQuestions(data));
    client.get<Feedback[]>("/feedbacks/mine").then(({ data }) => setFeedbacks(data));
  }, [user]);

  const sessionTopic = (sessionId: number) =>
    allSessions.find((s) => s.id === sessionId)?.topic ?? `세션 #${sessionId}`;

  return (
    <section>
      <h1>마이페이지</h1>
      <p>{user?.name}</p>

      <h2>내 발표 일정</h2>
      {sessions.length === 0 ? (
        <p>발표 예정인 세션이 없습니다.</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {session.scheduled_date} — {session.topic}
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
