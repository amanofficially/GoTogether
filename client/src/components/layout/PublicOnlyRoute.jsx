import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/** Where a logged-in user is sent when they try to visit a public-only page. */
export function dashboardPathFor(user) {
  if (user?.role === "admin") return "/dashboard/admin";
  if (user?.role === "driver") return "/dashboard/driver";
  return "/dashboard/passenger";
}

/**
 * Wraps marketing/auth pages (Landing, About, Features, Login, Signup,
 * Forgot Password) so that an already-logged-in user is bounced straight to
 * their dashboard instead of being able to browse the public site.
 */
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, initializing, user } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={dashboardPathFor(user)} replace />;
  }

  return children;
}
