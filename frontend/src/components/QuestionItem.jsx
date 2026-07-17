export default function QuestionItem({ question }) {
  return (
    <div className="question-item">
      <p>{question.content}</p>
      <span className={`badge ${question.resolved ? "badge--approved" : "badge--warning"}`}>
        {question.resolved ? "해결됨" : "미해결"}
      </span>
      {question.answer_note && <p className="question-item__answer">{question.answer_note}</p>}
    </div>
  );
}
