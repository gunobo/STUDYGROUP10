export default function Login() {
  return (
    <section className="login-card">
      <h1>로그인</h1>
      <p>학교 구글 계정으로 로그인하면 자동으로 가입됩니다.</p>
      <a href="/api/auth/google/login">
        <button>구글 계정으로 로그인</button>
      </a>
    </section>
  );
}
