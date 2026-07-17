import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const { user, loading, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
