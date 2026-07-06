import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineClipboardList, HiStar, HiCheckCircle } from "react-icons/hi";
import { Card, Badge, EmptyState } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import RatingModal from "../components/ride/RatingModal";
import { getMyBookings, cancelBooking } from "../services/bookingService";
import { getMyRatings } from "../services/ratingService";
import { getErrorMessage } from "../lib/api";

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const tone = { pending: "route", confirmed: "transit", completed: "neutral", cancelled: "alert", rejected: "alert" };

export default function MyBookingsPage() {
  const [tab, setTab] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  // Set of "rideId-toUserId" pairs the passenger has already reviewed.
  const [ratedKeys, setRatedKeys] = useState(new Set());
  const [ratingTarget, setRatingTarget] = useState(null); // { rideId, toUserId, toName, toAvatar }

  const load = () => {
    setLoading(true);
    Promise.all([getMyBookings(), getMyRatings().catch(() => [])])
      .then(([myBookings, myRatings]) => {
        setBookings(myBookings);
        setRatedKeys(new Set(myRatings.map((r) => `${r.ride}-${r.to}`)));
      })
      .catch((err) => setError(getErrorMessage(err, "Couldn't load your bookings.")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const hasRated = (rideId, toUserId) => ratedKeys.has(`${rideId}-${toUserId}`);

  const handleRatingSubmitted = () => {
    if (!ratingTarget) return;
    setRatedKeys((cur) => new Set(cur).add(`${ratingTarget.rideId}-${ratingTarget.toUserId}`));
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelBooking(id, "Cancelled by passenger");
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't cancel this booking."));
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">My bookings</h1>
      <p className="mt-1 text-sm text-[var(--color-line)]">Every seat you've booked, confirmed or completed.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[var(--color-ink)] text-[var(--color-paper)]" : "bg-[var(--color-paper-dim)] text-[var(--color-line)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HiOutlineClipboardList className="mx-auto text-[var(--color-line)]" />}
            title="No bookings here yet"
            body="Once you book a seat, it'll show up in this list."
            action={<Button as={Link} to="/search-ride">Find a ride</Button>}
          />
        ) : (
          filtered.map((b) => (
            <Card key={b.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <img src={b.ride.driver.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-display text-base font-semibold text-[var(--color-ink)]">{b.ride.from} → {b.ride.to}</p>
                  <p className="text-xs text-[var(--color-line)]">{b.ride.date} · {b.ride.time} · {b.seatsBooked} seat{b.seatsBooked > 1 ? "s" : ""} · booked {b.bookedOn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-display text-base font-semibold text-[var(--color-ink)]">₹{b.fare}</p>
                  <Badge tone={tone[b.status]}>{b.status}</Badge>
                </div>
                {["pending", "confirmed"].includes(b.status) && (
                  <Button size="sm" variant="outline" disabled={cancellingId === b.id} onClick={() => handleCancel(b.id)}>
                    {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                  </Button>
                )}
                {b.status === "completed" && (
                  hasRated(b.ride.id, b.ride.driver.id) ? (
                    <Badge tone="transit">
                      <HiCheckCircle className="h-3.5 w-3.5" /> Reviewed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRatingTarget({
                          rideId: b.ride.id,
                          toUserId: b.ride.driver.id,
                          toName: b.ride.driver.name,
                          toAvatar: b.ride.driver.avatar,
                        })
                      }
                    >
                      <HiStar className="h-4 w-4" /> Rate driver
                    </Button>
                  )
                )}
                <Button as={Link} to={`/ride/${b.ride.id}`} size="sm" variant="outline">
                  {b.ride.status === "ongoing" ? "Track live" : "Details"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {ratingTarget && (
        <RatingModal
          rideId={ratingTarget.rideId}
          toUserId={ratingTarget.toUserId}
          toName={ratingTarget.toName}
          toAvatar={ratingTarget.toAvatar}
          onClose={() => setRatingTarget(null)}
          onSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
}
