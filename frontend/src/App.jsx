import { Link, Route, Routes } from "react-router-dom";
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
      <nav className="app__nav">
        <Link to="/">홈</Link>
        <Link to="/apply">참가 신청</Link>
        <Link to="/schedule">일정표</Link>
        <Link to="/fines">벌금 현황</Link>
        <Link to="/members">참가자 목록</Link>
        <Link to="/mypage">마이페이지</Link>
        <Link to="/admin">관리자</Link>
      </nav>

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
