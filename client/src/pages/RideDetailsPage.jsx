import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HiBadgeCheck, HiOutlineChatAlt2, HiOutlineShieldCheck, HiCheckCircle, HiOutlineLocationMarker, HiOutlinePlay, HiOutlineFlag } from "react-icons/hi";
import { Card, Badge, Field, inputClass } from "../components/ui/Primitives";
import RouteLine from "../components/ui/RouteLine";
import LiveMap from "../components/ride/LiveMap";
import Button from "../components/ui/Button";
import ChatPanel from "../components/chat/ChatPanel";
import { useAuth } from "../context/AuthContext";
import { useDriverLocationSharing, useLiveLocationFeed } from "../hooks/useRideTracking";
import { getRideById, updateRideStatus } from "../services/rideService";
import { createBooking } from "../services/bookingService";
import { getUserRatings } from "../services/ratingService";
import { distanceKm, estimateDurationMin, getRoute } from "../lib/geocode";
import { getErrorMessage } from "../lib/api";

export default function RideDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [route, setRoute] = useState(null);

  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");

  const isOwnRide = isAuthenticated && ride && user?._id === ride.driver.id;
  const rideIsOngoing = ride?.status === "ongoing";

  // Driver: broadcasts their live position while the ride is ongoing.
  const driverShare = useDriverLocationSharing(ride?.id);
  // Everyone (driver + participants): listens for the live position over
  // the socket the moment the ride goes "ongoing".
  const { location: liveLocation } = useLiveLocationFeed(ride?.id, isAuthenticated && rideIsOngoing);

  const driverPosition = liveLocation?.coordinates;
  const remainingKm = driverPosition && ride ? distanceKm(driverPosition, ride._raw.destination.coordinates) : null;
  const remainingMin = remainingKm != null ? estimateDurationMin(remainingKm) : null;

  const handleStartRide = async () => {
    setStatusError("");
    setStatusUpdating(true);
    try {
      const updated = await updateRideStatus(ride.id, "ongoing");
      setRide(updated);
      driverShare.start();
    } catch (err) {
      setStatusError(getErrorMessage(err, "Couldn't start the ride."));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCompleteRide = async () => {
    setStatusError("");
    setStatusUpdating(true);
    try {
      const updated = await updateRideStatus(ride.id, "completed");
      setRide(updated);
      driverShare.stop();
    } catch (err) {
      setStatusError(getErrorMessage(err, "Couldn't complete the ride."));
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    getRideById(id)
      .then((r) => {
        if (cancelled) return;
        setRide(r);
        return getUserRatings(r.driver.id).catch(() => []);
      })
      .then((rv) => !cancelled && rv && setReviews(rv))
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, "Couldn't load this ride.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!ride) return;
    let cancelled = false;
    getRoute(ride._raw.origin.coordinates, ride._raw.destination.coordinates)
      .then((r) => !cancelled && r && setRoute(r))
      .catch(() => {
        // Public OSRM instance may be unreachable/rate-limited — the UI
        // simply keeps using the Haversine estimate already on `ride`.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id]);

  const handleBook = async () => {
    if (!isAuthenticated) return navigate("/login", { state: { from: { pathname: `/ride/${id}` } } });
    setBookError("");
    setBooking(true);
    try {
      await createBooking({
        rideId: ride.id,
        seatsBooked: seats,
        pickupPoint: { address: ride.from, coordinates: ride._raw.origin.coordinates },
      });
      setBooked(true);
    } catch (err) {
      setBookError(getErrorMessage(err, "Couldn't book this ride. Please try again."));
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  if (loadError || !ride) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-[var(--color-alert)]">{loadError || "Ride not found."}</p>
        <Button as={Link} to="/search-ride" className="mt-5">Back to search</Button>
      </div>
    );
  }

  const displayDistanceKm = (route?.distanceKm ?? ride.distanceKm).toFixed(1);
  const displayDurationMin = route?.durationMin ?? ride.durationMin;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <Link to="/search-ride" className="text-sm text-[var(--color-line)] hover:text-[var(--color-route)]">← Back to search</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              {ride.from} → {ride.to}
            </h1>
            <span className="font-mono-tag text-xs text-[var(--color-line)]">{ride.id.slice(-8)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="neutral">{ride.date} · {ride.time}</Badge>
            <Badge tone="neutral">{displayDistanceKm} km · ~{displayDurationMin} min</Badge>
            <Badge tone={ride.seatsAvailable > 0 ? "transit" : "alert"}>{ride.seatsAvailable > 0 ? `${ride.seatsAvailable} seats left` : "Full"}</Badge>
            {ride.status !== "upcoming" && <Badge tone={ride.status === "cancelled" ? "alert" : "neutral"}>{ride.status}</Badge>}
          </div>

          <Card className="mt-6 p-6">
            <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Route</p>
            <div className="mt-3">
              <RouteLine orientation="vertical" stops={ride.waypoints.map((w, i) => ({ label: w, sub: i === 0 ? `Pickup · ${ride.time}` : i === ride.waypoints.length - 1 ? "Drop-off" : "Waypoint" }))} />
            </div>
          </Card>

          <Card className="mt-5 overflow-hidden p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Live map</p>
              {rideIsOngoing && (
                <Badge tone={driverPosition ? "transit" : "neutral"}>
                  <HiOutlineLocationMarker className="h-3.5 w-3.5" />
                  {driverPosition ? "Live" : "Waiting for driver's location…"}
                </Badge>
              )}
            </div>
            <div className="mt-3 h-64 sm:h-80">
              <LiveMap
                origin={ride._raw.origin.coordinates}
                destination={ride._raw.destination.coordinates}
                driverPosition={driverPosition}
                routeGeometry={route?.geometry}
              />
            </div>
            {rideIsOngoing && remainingKm != null && (
              <p className="mt-3 text-sm text-[var(--color-line)]">
                <span className="font-semibold text-[var(--color-ink)]">{remainingKm.toFixed(1)} km</span> remaining to drop-off
                {remainingMin != null && <> · ~{remainingMin} min left</>}
              </p>
            )}
          </Card>

          <Card className="mt-5 p-6">
            <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Driver</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={ride.driver.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <p className="flex items-center gap-1 font-display text-lg font-semibold text-[var(--color-ink)]">
                    {ride.driver.name} {ride.driver.verified && <HiBadgeCheck className="h-5 w-5 text-[var(--color-transit)]" />}
                  </p>
                  <p className="text-sm text-[var(--color-line)]">★ {ride.driver.rating.toFixed(1)} ({ride.driver.ratingCount}) · {ride.vehicle}</p>
                </div>
              </div>
              {isAuthenticated && !isOwnRide && (
                <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
                  <HiOutlineChatAlt2 className="h-4 w-4" /> Message
                </Button>
              )}
            </div>
            {ride.driver.verified && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-transit-dim)] px-3 py-2 text-xs text-[var(--color-transit)]">
                <HiOutlineShieldCheck className="h-4 w-4" /> Vehicle documents verified
              </p>
            )}
          </Card>

          <Card className="mt-5 p-6">
            <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Ride preferences</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ride.preferences.map((p) => <Badge key={p} tone="neutral">{p}</Badge>)}
            </div>
          </Card>

          <Card className="mt-5 p-6">
            <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Rider reviews</p>
            <div className="mt-4 space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-line)]">No reviews yet.</p>
              ) : (
                reviews.map((rv) => (
                  <div key={rv._id} className="flex gap-3 border-b border-[var(--color-line)]/10 pb-4 last:border-0 last:pb-0">
                    <img src={rv.from?.avatar?.url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rv.from?.name || "?")}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{rv.from?.name} <span className="ml-1 font-normal text-[var(--color-line)]">★ {rv.rating}</span></p>
                      <p className="text-sm text-[var(--color-line)]">{rv.review}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <Card className="p-6">
            {isOwnRide ? (
              <div>
                <p className="text-sm text-[var(--color-line)]">
                  This is your ride. {ride.seatsAvailable} of {ride.seatsTotal} seats left · ₹{ride.price}/seat.
                </p>

                {statusError && <p className="mt-3 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-xs text-[var(--color-alert)]">{statusError}</p>}
                {driverShare.error && <p className="mt-3 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-xs text-[var(--color-alert)]">{driverShare.error}</p>}

                {ride.status === "upcoming" && (
                  <Button className="mt-5 w-full" size="lg" disabled={statusUpdating} onClick={handleStartRide}>
                    <HiOutlinePlay className="h-4 w-4" /> {statusUpdating ? "Starting…" : "Start ride"}
                  </Button>
                )}

                {rideIsOngoing && (
                  <>
                    <Button
                      className="mt-5 w-full"
                      variant={driverShare.sharing ? "outline" : "primary"}
                      onClick={() => (driverShare.sharing ? driverShare.stop() : driverShare.start())}
                    >
                      <HiOutlineLocationMarker className="h-4 w-4" />
                      {driverShare.sharing ? "Sharing live location" : "Share live location"}
                    </Button>
                    {driverShare.sharing && (
                      <p className="mt-2 text-center text-xs text-[var(--color-line)]">
                        {driverShare.lastSentAt ? `Last updated ${driverShare.lastSentAt.toLocaleTimeString()}` : "Getting your position…"}
                      </p>
                    )}
                    <Button className="mt-3 w-full" variant="outline" disabled={statusUpdating} onClick={handleCompleteRide}>
                      <HiOutlineFlag className="h-4 w-4" /> {statusUpdating ? "Completing…" : "Complete ride"}
                    </Button>
                  </>
                )}

                {["completed", "cancelled"].includes(ride.status) && (
                  <p className="mt-5 rounded-lg bg-[var(--color-paper-dim)] px-3 py-2 text-center text-sm text-[var(--color-line)]">
                    This ride is {ride.status}.
                  </p>
                )}

                <Link to="/dashboard/driver" className="mt-4 block text-center text-xs font-medium text-[var(--color-route)]">
                  Go to driver dashboard
                </Link>
              </div>
            ) : booked ? (
              <div className="flex flex-col items-center py-4 text-center">
                <HiCheckCircle className="h-12 w-12 text-[var(--color-transit)]" />
                <h3 className="mt-3 font-display text-lg font-semibold text-[var(--color-ink)]">Request sent</h3>
                <p className="mt-1 text-sm text-[var(--color-line)]">{ride.driver.name} will confirm your seat shortly.</p>
                <Button className="mt-5 w-full" onClick={() => navigate("/bookings")}>View my bookings</Button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-2xl font-semibold text-[var(--color-ink)]">₹{ride.price}</p>
                  <span className="text-xs text-[var(--color-line)]">per seat</span>
                </div>
                <div className="mt-5">
                  <Field label="Seats needed">
                    <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className={inputClass(false)}>
                      {Array.from({ length: ride.seatsAvailable || 1 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)]/10 pt-4 text-sm">
                  <span className="text-[var(--color-line)]">Total fare</span>
                  <span className="font-display text-lg font-semibold text-[var(--color-ink)]">₹{ride.price * seats}</span>
                </div>
                {bookError && <p className="mt-3 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-xs text-[var(--color-alert)]">{bookError}</p>}
                <Button className="mt-5 w-full" size="lg" disabled={ride.seatsAvailable === 0 || booking || ride.status !== "upcoming"} onClick={handleBook}>
                  {booking ? "Sending request…" : ride.seatsAvailable === 0 ? "Ride full" : ride.status !== "upcoming" ? "Unavailable" : "Request to book"}
                </Button>
                <p className="mt-3 text-center text-xs text-[var(--color-line)]">You won't be charged until the driver confirms.</p>
              </>
            )}
          </Card>
        </aside>
      </div>

      {chatOpen && <ChatPanel rideId={ride.id} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
