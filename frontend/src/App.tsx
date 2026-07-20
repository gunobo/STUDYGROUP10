import { useEffect } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Admin from "./pages/Admin";
import Apply from "./pages/Apply";
import Fines from "./pages/Fines";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MemberDetail from "./pages/MemberDetail";
import Members from "./pages/Members";
import MyPage from "./pages/MyPage";
import QuestionBoard from "./pages/QuestionBoard";
import Schedule from "./pages/Schedule";
import SessionDetail from "./pages/SessionDetail";
import SessionEdit from "./pages/SessionEdit";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="app">
      <header className="app__header">
        <Link to="/" className="app__brand">
          <span>study</span>2026
        </Link>

        <div className="app__header-right">
          <nav className="app__nav">
            <NavLink to="/" end>
              홈
            </NavLink>
            <NavLink to="/apply">참가 신청</NavLink>
            <NavLink to="/schedule">일정표</NavLink>
            <NavLink to="/fines">벌금 현황</NavLink>
            <NavLink to="/members">참가자 목록</NavLink>
            {user && <NavLink to="/mypage">마이페이지</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin">관리자</NavLink>}
          </nav>

          <div className="app__auth">
            {loading ? null : user ? (
              <button type="button" className="app__auth-btn" onClick={() => logout()}>
                {user.name} · 로그아웃
              </button>
            ) : (
              <a href="/api/auth/google/login">
                <button type="button" className="app__auth-btn">
                  로그인
                </button>
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/apply"
            element={
              <AuthGuard>
                <Apply />
              </AuthGuard>
            }
          />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route
            path="/sessions/:id/edit"
            element={
              <AuthGuard>
                <SessionEdit />
              </AuthGuard>
            }
          />
          <Route path="/sessions/:id/questions" element={<QuestionBoard />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route
            path="/mypage"
            element={
              <AuthGuard>
                <MyPage />
              </AuthGuard>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <AuthGuard adminOnly>
                <Admin />
              </AuthGuard>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
