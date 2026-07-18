import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import type { Question, StudySession } from "../types";
import QuestionItem from "./QuestionItem";
import QuizRunner from "./QuizRunner";

const TABS = [
  { key: "concept_note", label: "개념" },
  { key: "example_note", label: "실사용 예시" },
  { key: "demo_note", label: "시연/실습" },
  { key: "questions", label: "Q&A" },
  { key: "quiz_json", label: "퀴즈/정리" },
] as const;

function QATab({ sessionId }: { sessionId: number }) {
  const user = useAuthStore((state) => state.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [content, setContent] = useState("");

  const load = () => {
    client.get<Question[]>(`/sessions/${sessionId}/questions`).then(({ data }) => setQuestions(data));
  };

  useEffect(load, [sessionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await client.post(`/sessions/${sessionId}/questions`, { content });
    setContent("");
    load();
  };

  return (
    <div className="qa-tab">
      {user ? (
        <form className="question-form" onSubmit={submit}>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="질문을 입력하세요" />
          <button type="submit">등록</button>
        </form>
      ) : (
        <p className="note">
          로그인 후 질문을 남길 수 있습니다. <a href="/api/auth/google/login">구글 계정으로 로그인</a>
        </p>
      )}
      {questions.length === 0 ? (
        <p className="note">아직 등록된 질문이 없습니다.</p>
      ) : (
        <ul className="qa-tab__list">
          {questions.map((q) => (
            <li key={q.id}>
              <QuestionItem question={q} />
            </li>
          ))}
        </ul>
      )}
      <Link to={`/sessions/${sessionId}/questions`} className="qa-tab__link">
        전체 질문 게시판 보기
      </Link>
    </div>
  );
}

interface SessionTabsProps {
  session: StudySession;
}

export default function SessionTabs({ session }: SessionTabsProps) {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>(TABS[0].key);

  return (
    <div className="session-tabs">
      <div className="session-tabs__nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={tab.key === active ? "is-active" : ""}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="session-tabs__content">
        {active === "questions" ? (
          <QATab sessionId={session.id} />
        ) : active === "quiz_json" ? (
          <QuizRunner quiz={session.quiz_json} />
        ) : typeof session[active] === "string" ? (
          session[active]
        ) : (
          <p className="note">아직 등록된 내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
