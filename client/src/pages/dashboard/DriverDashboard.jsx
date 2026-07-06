import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlinePlus, HiOutlineTruck, HiCheck, HiX } from "react-icons/hi";
import { Card, Badge, EmptyState } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getMyOfferedRides } from "../../services/rideService";
import { getBookingsForRide, respondToBooking } from "../../services/bookingService";
import { getErrorMessage } from "../../lib/api";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const offered = await getMyOfferedRides();
      setRides(offered);

      const activeRides = offered.filter((r) => ["upcoming", "ongoing"].includes(r.status));
      const bookingsByRide = await Promise.all(
        activeRides.map((r) => getBookingsForRide(r.id).catch(() => []))
      );
      const pending = activeRides.flatMap((r, i) =>
        bookingsByRide[i].filter((b) => b.status === "pending").map((b) => ({ ...b, ride: r }))
      );
      setPendingRequests(pending);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load your dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (bookingId, action) => {
    setRespondingId(bookingId);
    try {
      await respondToBooking(bookingId, action);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update this request."));
    } finally {
      setRespondingId(null);
    }
  };

  const upcomingRides = rides.filter((r) => ["upcoming", "ongoing"].includes(r.status));
  const totalEarnings = rides
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.price * (r.seatsTotal - r.seatsAvailable), 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-[var(--color-line)]">Manage your rides and booking requests.</p>
        </div>
        <Button as={Link} to="/offer-ride"><HiOutlinePlus className="h-4 w-4" /> Offer a ride</Button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Active rides</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">{upcomingRides.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Pending requests</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">{pendingRequests.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-[var(--color-line)]">Total earnings</p><p className="mt-1 font-display text-2xl font-semibold text-[var(--color-ink)]">₹{totalEarnings}</p></Card>
      </div>

      <p className="mt-8 font-mono-tag text-xs uppercase text-[var(--color-line)]">Pending requests</p>
      <div className="mt-3 space-y-3">
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-[var(--color-line)]">No pending requests right now.</p>
        ) : (
          pendingRequests.map((req) => (
            <Card key={req._id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <img src={req.passenger?.avatar?.url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.passenger?.name || "?")}`} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{req.passenger?.name}</p>
                  <p className="text-xs text-[var(--color-line)]">{req.ride.from} → {req.ride.to} · {req.seatsBooked} seat{req.seatsBooked > 1 ? "s" : ""} · ₹{req.fare}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={respondingId === req._id} onClick={() => respond(req._id, "approve")}>
                  <HiCheck className="h-4 w-4" /> Accept
                </Button>
                <Button size="sm" variant="outline" disabled={respondingId === req._id} onClick={() => respond(req._id, "reject")}>
                  <HiX className="h-4 w-4" /> Decline
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Your rides</p>
        <Link to="/ride-history" className="text-sm font-medium text-[var(--color-route)]">Ride history</Link>
      </div>

      <div className="mt-3 space-y-3">
        {rides.length === 0 ? (
          <EmptyState
            icon={<HiOutlineTruck className="mx-auto text-[var(--color-line)]" />}
            title="You haven't offered a ride yet"
            body="Post your route once and matching passengers can request a seat."
            action={<Button as={Link} to="/offer-ride">Offer a ride</Button>}
          />
        ) : (
          rides.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{r.from} → {r.to}</p>
                <p className="text-xs text-[var(--color-line)]">{r.date} · {r.time} · {r.seatsAvailable}/{r.seatsTotal} seats left · ₹{r.price}/seat</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={r.status === "cancelled" ? "alert" : r.status === "upcoming" || r.status === "ongoing" ? "transit" : "neutral"}>{r.status}</Badge>
                {["upcoming", "ongoing"].includes(r.status) && (
                  <Button as={Link} to={`/ride/${r.id}`} size="sm" variant="outline">Manage</Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
