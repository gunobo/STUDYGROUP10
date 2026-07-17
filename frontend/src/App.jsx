import { NavLink, Route, Routes } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Admin from "./pages/Admin";
import Apply from "./pages/Apply";
import Fines from "./pages/Fines";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Members from "./pages/Members";
import MyPage from "./pages/MyPage";
import QuestionBoard from "./pages/QuestionBoard";
import Schedule from "./pages/Schedule";
import SessionDetail from "./pages/SessionDetail";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span>study</span>2026
        </div>
        <nav className="app__nav">
          <NavLink to="/" end>
            홈
          </NavLink>
          <NavLink to="/apply">참가 신청</NavLink>
          <NavLink to="/schedule">일정표</NavLink>
          <NavLink to="/fines">벌금 현황</NavLink>
          <NavLink to="/members">참가자 목록</NavLink>
          <NavLink to="/mypage">마이페이지</NavLink>
          <NavLink to="/admin">관리자</NavLink>
        </nav>
      </header>

      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/sessions/:id/questions" element={<QuestionBoard />} />
          <Route path="/fines" element={<Fines />} />
          <Route path="/members" element={<Members />} />
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
