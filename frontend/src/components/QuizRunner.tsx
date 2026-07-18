import { useState } from "react";

interface QuizQuestion {
  question: string;
  options?: string[];
  answer?: number;
  explanation?: string;
}

interface QuizRunnerProps {
  quiz: Record<string, unknown> | null | undefined;
}

export default function QuizRunner({ quiz }: QuizRunnerProps) {
  const questions = (quiz?.questions as QuizQuestion[] | undefined) ?? [];
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length === 0) return <p className="note">등록된 퀴즈가 없습니다.</p>;

  const gradedQuestions = questions.filter((q) => typeof q.answer === "number");
  const correctCount = gradedQuestions.filter((q) => selected[questions.indexOf(q)] === q.answer).length;

  const select = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setSelected((s) => ({ ...s, [qIndex]: optIndex }));
  };

  const reset = () => {
    setSelected({});
    setSubmitted(false);
  };

  return (
    <div className="quiz-runner">
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-runner__question">
          <p className="quiz-runner__question-text">
            {qi + 1}. {q.question}
          </p>
          {q.options && q.options.length > 0 ? (
            <div className="quiz-runner__options">
              {q.options.map((opt, oi) => {
                const isSelected = selected[qi] === oi;
                const isCorrectOption = submitted && typeof q.answer === "number" && oi === q.answer;
                const isWrongSelected = submitted && isSelected && typeof q.answer === "number" && oi !== q.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    className={[
                      "quiz-runner__option",
                      isSelected ? "quiz-runner__option--selected" : "",
                      isCorrectOption ? "quiz-runner__option--correct" : "",
                      isWrongSelected ? "quiz-runner__option--wrong" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => select(qi, oi)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="note">서술형 문제입니다. 직접 생각해보세요.</p>
          )}
          {submitted && q.explanation && <p className="quiz-runner__explanation">{q.explanation}</p>}
        </div>
      ))}
      <div className="quiz-runner__actions">
        {!submitted ? (
          <button type="button" onClick={() => setSubmitted(true)}>
            제출하고 정답 확인
          </button>
        ) : (
          <>
            {gradedQuestions.length > 0 && (
              <p className="quiz-runner__score">
                {gradedQuestions.length}문제 중 {correctCount}문제 정답
              </p>
            )}
            <button type="button" onClick={reset}>
              다시 풀기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
