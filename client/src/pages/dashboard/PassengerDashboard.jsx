import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineSearch, HiOutlineClipboardList } from "react-icons/hi";
import { Card, Badge, EmptyState } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getMyBookings } from "../../services/bookingService";
import { getErrorMessage } from "../../lib/api";

const tone = { pending: "route", confirmed: "transit", completed: "neutral", cancelled: "alert", rejected: "alert" };

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load your bookings.")))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => new Date(a.ride.departureTime) - new Date(b.ride.departureTime));
  const nextRide = upcoming[0];
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.fare, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Welcome back, {user?.name?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-[var(--color-line)]">Here's what's happening with your rides.</p>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Upcoming rides</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">{upcoming.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Rides completed</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">{completedCount}</p></Card>
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Total spent</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">₹{totalSpent}</p></Card>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Your next ride</p>
        <Button as={Link} to="/search-ride" size="sm" variant="outline"><HiOutlineSearch className="h-4 w-4" /> Find a ride</Button>
      </div>

      {nextRide ? (
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <img src={nextRide.ride.driver.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-display text-base font-semibold text-[var(--color-ink)]">{nextRide.ride.from} → {nextRide.ride.to}</p>
              <p className="text-xs text-[var(--color-line)]">{nextRide.ride.date} · {nextRide.ride.time} · {nextRide.ride.driver.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={tone[nextRide.status]}>{nextRide.status}</Badge>
            <Button as={Link} to={`/ride/${nextRide.ride.id}`} size="sm" variant="outline">Details</Button>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<HiOutlineClipboardList className="mx-auto text-[var(--color-line)]" />}
          title="No upcoming rides"
          body="Search for a ride that matches your route and book a seat."
          action={<Button as={Link} to="/search-ride">Find a ride</Button>}
        />
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Recent bookings</p>
        <Link to="/bookings" className="text-sm font-medium text-[var(--color-route)]">View all</Link>
      </div>
      <div className="mt-3 space-y-3">
        {bookings.slice(0, 4).map((b) => (
          <Card key={b.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{b.ride.from} → {b.ride.to}</p>
              <p className="text-xs text-[var(--color-line)]">{b.ride.date} · ₹{b.fare}</p>
            </div>
            <Badge tone={tone[b.status]}>{b.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
