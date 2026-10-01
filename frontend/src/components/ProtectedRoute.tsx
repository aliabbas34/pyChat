import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Renders child routes only for logged-in users (or only for guests, with `guestOnly`). */
export default function ProtectedRoute({ guestOnly = false }: { guestOnly?: boolean }) {
  const { me, loading } = useAuth();
  if (loading) return <p className="p-6 text-slate-500">Loading…</p>;
  if (guestOnly) return me ? <Navigate to="/" replace /> : <Outlet />;
  return me ? <Outlet /> : <Navigate to="/login" replace />;
}
