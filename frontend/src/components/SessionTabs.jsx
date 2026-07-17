import { useState } from "react";

const TABS = [
  { key: "concept_note", label: "개념" },
  { key: "example_note", label: "실사용 예시" },
  { key: "demo_note", label: "시연/실습" },
  { key: "questions", label: "Q&A" },
  { key: "quiz_json", label: "퀴즈/정리" },
];

export default function SessionTabs({ session }) {
  const [active, setActive] = useState(TABS[0].key);

  return (
    <div className="session-tabs">
      <div className="session-tabs__nav">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActive(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="session-tabs__content">{session?.[active] ?? ""}</div>
    </div>
  );
}
