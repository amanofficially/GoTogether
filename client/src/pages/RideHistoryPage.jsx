import { useEffect, useState } from "react";
import { Card, Badge } from "../components/ui/Primitives";
import { getMyOfferedRides } from "../services/rideService";
import { getMyBookings } from "../services/bookingService";
import { getErrorMessage } from "../lib/api";

const tone = { completed: "neutral", cancelled: "alert", ongoing: "transit", upcoming: "transit" };

export default function RideHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMyOfferedRides(), getMyBookings()])
      .then(([offered, bookings]) => {
        const asDriver = offered
          .filter((r) => r.status !== "upcoming")
          .map((r) => ({ role: "Drove", ride: r, sortKey: r.departureTime }));
        const asPassenger = bookings
          .filter((b) => ["completed", "cancelled"].includes(b.status))
          .map((b) => ({ role: "Rode", ride: b.ride, sortKey: b.ride.departureTime }));
        const merged = [...asDriver, ...asPassenger].sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));
        setItems(merged);
      })
      .catch((err) => setError(getErrorMessage(err, "Couldn't load your ride history.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Ride history</h1>
      <p className="mt-1 text-sm text-[var(--color-line)]">A record of every ride you've taken or driven.</p>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--color-line)]">No past rides yet.</p>
      ) : (
        <div className="relative mt-8 pl-8">
          <div className="absolute left-[7px] top-2 bottom-2 border-l-[3px] border-dashed border-[var(--color-line)]/30" />
          <div className="space-y-6">
            {items.map(({ role, ride }, i) => (
              <div key={`${ride.id}-${role}-${i}`} className="relative">
                <span
                  className="absolute -left-8 top-1.5 h-4 w-4 rounded-full ring-4 ring-[var(--color-paper)]"
                  style={{ background: ride.status === "cancelled" ? "var(--color-alert)" : "var(--color-transit)" }}
                />
                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold text-[var(--color-ink)]">
                        <span className="mr-2 text-xs font-normal uppercase tracking-wide text-[var(--color-line)]">{role}</span>
                        {ride.from} → {ride.to}
                      </p>
                      <p className="text-xs text-[var(--color-line)]">{ride.date} · {ride.time} · {ride.distanceKm} km</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-base font-semibold text-[var(--color-ink)]">₹{ride.price}</span>
                      <Badge tone={tone[ride.status]}>{ride.status}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
