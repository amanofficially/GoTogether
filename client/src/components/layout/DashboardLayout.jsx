import { NavLink, Outlet } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import Navbar from "./Navbar";
import { useAuth } from "../../context/AuthContext";

const baseLinks = [
  {
    to: "/dashboard/passenger",
    label: "Passenger dashboard",
    icon: HiOutlineViewGrid,
  },
  { to: "/dashboard/driver", label: "Driver dashboard", icon: HiOutlineTruck },
  { to: "/bookings", label: "My bookings", icon: HiOutlineClipboardList },
  { to: "/ride-history", label: "Ride history", icon: HiOutlineClock },
  { to: "/notifications", label: "Notifications", icon: HiOutlineBell },
  { to: "/profile", label: "Profile", icon: HiOutlineUser },
  { to: "/settings", label: "Settings", icon: HiOutlineCog },
];

const adminLink = { to: "/dashboard/admin", label: "Admin dashboard", icon: HiOutlineShieldCheck };

export default function DashboardLayout() {
  const { user } = useAuth();
  const links = user?.role === "admin" ? [adminLink, ...baseLinks] : baseLinks;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-5 py-8 sm:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[var(--color-line)]/10 bg-white p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[var(--color-line)]/10 px-2 pb-4">
              <img
                src={user?.avatar?.url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-[var(--color-line)]">
                  {user?.email}
                </p>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-route)]/10 text-[var(--color-route)]"
                        : "text-[var(--color-ink)]/75 hover:bg-[var(--color-paper-dim)]"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-16 lg:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--color-line)]/10 bg-white py-2 lg:hidden">
        {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${isActive ? "text-[var(--color-route)]" : "text-[var(--color-line)]"}`
            }
          >
            <Icon className="h-5 w-5" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
