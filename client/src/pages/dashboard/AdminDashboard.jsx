import { useEffect, useState } from "react";
import {
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineSearch,
  HiOutlineBan,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { Card, Badge, EmptyState, StatCard } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import {
  getDashboardStats,
  listUsers,
  banUser,
  unbanUser,
  listRides,
} from "../../services/adminService";
import { getErrorMessage } from "../../lib/api";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "rides", label: "Rides" },
];

const rideStatusTone = { scheduled: "route", ongoing: "transit", completed: "neutral", cancelled: "alert" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Admin dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-line)]">
        Platform-wide stats, user moderation, and ride oversight.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border border-[var(--color-line)]/25 text-[var(--color-ink)]/75 hover:border-[var(--color-ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "rides" && <RidesTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load dashboard stats.")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Total users" value={stats.totalUsers} tone="ink" />
      <StatCard label="Registered drivers" value={stats.totalDrivers} tone="route" />
      <StatCard label="Total rides" value={stats.totalRides} tone="ink" />
      <StatCard label="Active rides" value={stats.activeRides} tone="transit" />
      <StatCard label="Total bookings" value={stats.totalBookings} tone="ink" />
      <StatCard label="Completed rides" value={stats.completedRides} tone="route" />
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState({ users: [], page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    listUsers({ page, limit: 20, search })
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load users.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleBan = async (user) => {
    setActingId(user._id);
    try {
      if (user.isBanned) {
        await unbanUser(user._id);
      } else {
        await banUser(user._id, "Violation of platform policy");
      }
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update this user."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-line)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-[var(--color-line)]/25 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-route)]"
          />
        </div>
        <Button type="submit" variant="outline" size="md">
          Search
        </Button>
      </form>

      {error && <ErrorBanner message={error} className="mt-4" />}

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner />
        ) : data.users.length === 0 ? (
          <EmptyState
            icon={<HiOutlineUsers className="mx-auto text-[var(--color-line)]" />}
            title="No users found"
            body="Try a different search term."
          />
        ) : (
          data.users.map((u) => (
            <Card key={u._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{u.name}</p>
                  {u.role === "admin" && <Badge tone="ink">admin</Badge>}
                  {u.isDriver && <Badge tone="route">driver</Badge>}
                  {u.isBanned && <Badge tone="alert">banned</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--color-line)]">
                  {u.email} · {u.phone}
                </p>
              </div>
              {u.role !== "admin" && (
                <Button
                  size="sm"
                  variant={u.isBanned ? "outline" : "danger"}
                  disabled={actingId === u._id}
                  onClick={() => toggleBan(u)}
                >
                  {u.isBanned ? (
                    <>
                      <HiOutlineShieldCheck className="h-4 w-4" /> Unban
                    </>
                  ) : (
                    <>
                      <HiOutlineBan className="h-4 w-4" /> Ban
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))
        )}
      </div>

      <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}

function RidesTab() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState({ rides: [], page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    listRides({ page, limit: 20, status })
      .then(setData)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load rides.")))
      .finally(() => setLoading(false));
  }, [page, status]);

  const statusOptions = ["", "scheduled", "ongoing", "completed", "cancelled"];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {statusOptions.map((s) => (
          <button
            key={s || "any"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              status === s
                ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border border-[var(--color-line)]/25 text-[var(--color-ink)]/75 hover:border-[var(--color-ink)]"
            }`}
          >
            {s || "Any status"}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} className="mt-4" />}

      <div className="mt-4 space-y-3">
        {loading ? (
          <Spinner />
        ) : data.rides.length === 0 ? (
          <EmptyState
            icon={<HiOutlineTruck className="mx-auto text-[var(--color-line)]" />}
            title="No rides found"
            body="Try a different status filter."
          />
        ) : (
          data.rides.map((r) => (
            <Card key={r._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {r.origin?.address} → {r.destination?.address}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-line)]">
                  {new Date(r.departureTime).toLocaleString("en-IN")} · Driver: {r.driver?.name} (
                  {r.driver?.email}) · {r.availableSeats}/{r.totalSeats} seats free
                </p>
              </div>
              <Badge tone={rideStatusTone[r.status] || "neutral"}>{r.status}</Badge>
            </Card>
          ))
        )}
      </div>

      <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-xs text-[var(--color-line)]">
        Page {page} of {totalPages}
      </span>
      <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
    </div>
  );
}

function ErrorBanner({ message, className = "" }) {
  return (
    <p className={`rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)] ${className}`}>
      {message}
    </p>
  );
}
