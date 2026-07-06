import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { dashboardPathFor } from "./PublicOnlyRoute";

/**
 * @param {string} [requireRole] - if set, only users whose `role` matches are
 *   allowed through; everyone else is redirected to their normal dashboard.
 *   (Used for /dashboard/admin — see App.jsx.)
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={dashboardPathFor(user)} replace />;
  }

  return children;
}
