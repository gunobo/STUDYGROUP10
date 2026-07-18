interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
