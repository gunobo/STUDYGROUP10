import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import QuestionItem from "./QuestionItem";

const TABS = [
  { key: "concept_note", label: "개념" },
  { key: "example_note", label: "실사용 예시" },
  { key: "demo_note", label: "시연/실습" },
  { key: "questions", label: "Q&A" },
  { key: "quiz_json", label: "퀴즈/정리" },
];

function QATab({ sessionId }) {
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState("");

  const load = () => {
    client.get(`/sessions/${sessionId}/questions`).then(({ data }) => setQuestions(data));
  };

  useEffect(load, [sessionId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await client.post(`/sessions/${sessionId}/questions`, { content });
    setContent("");
    load();
  };

  return (
    <div className="qa-tab">
      <form className="question-form" onSubmit={submit}>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="질문을 입력하세요" />
        <button type="submit">등록</button>
      </form>
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

export default function SessionTabs({ session }) {
  const [active, setActive] = useState(TABS[0].key);

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
        {active === "questions" ? <QATab sessionId={session.id} /> : (session?.[active] ?? "")}
      </div>
    </div>
  );
}
