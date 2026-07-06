import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX, HiOutlineBell } from "react-icons/hi";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { dashboardPathFor } from "./PublicOnlyRoute";

// Marketing pages only make sense for signed-out visitors — a logged-in
// user only ever sees the app pages (search/offer ride) plus their dashboard.
const guestLinks = [
  { to: "/", label: "Home" },
  { to: "/search-ride", label: "Find a ride" },
  { to: "/offer-ride", label: "Offer a ride" },
  { to: "/about", label: "About" },
  { to: "/features", label: "Features" },
  { to: "/contact", label: "Contact" },
];

const authedLinks = [
  { to: "/search-ride", label: "Find a ride" },
  { to: "/offer-ride", label: "Offer a ride" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const navLinks = isAuthenticated ? authedLinks : guestLinks;
  const dashboardPath = dashboardPathFor(user);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)]/10 bg-[var(--color-paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <img src="/logo.png" alt="Logo" className="w-36" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-[var(--color-route)]" : "text-[var(--color-ink)]/75 hover:text-[var(--color-ink)]"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="relative rounded-full p-2 text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]"
              >
                <HiOutlineBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-route)] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to={dashboardPath}
                className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-route)]"
              >
                Dashboard
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button as={Link} to="/signup" variant="primary" size="sm">
                Sign up free
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-[var(--color-ink)] lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--color-line)]/10 bg-[var(--color-paper)] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-[var(--color-route)]/10 text-[var(--color-route)]" : "text-[var(--color-ink)]"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-line)]/10 pt-4">
            {isAuthenticated ? (
              <>
                <Button
                  as={Link}
                  to={dashboardPath}
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  variant="primary"
                  onClick={() => setOpen(false)}
                >
                  Sign up free
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
