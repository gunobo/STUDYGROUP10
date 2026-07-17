import { useState } from "react";

export default function QuizRunner({ quiz }) {
  const questions = quiz?.questions ?? [];
  const [index, setIndex] = useState(0);

  if (questions.length === 0) return <p>등록된 퀴즈가 없습니다.</p>;

  const current = questions[index];

  return (
    <div className="quiz-runner">
      <p>{current.question}</p>
      {current.options?.map((option) => (
        <button key={option}>{option}</button>
      ))}
      <div>
        <button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          이전
        </button>
        <button
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}
