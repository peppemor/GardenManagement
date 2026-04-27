import { Navigate } from "react-router-dom";
import { getAuth } from "./api";

export default function ProtectedRoute({ children, roles = [] }) {
  const auth = getAuth();

  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(auth.user.ruolo)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
