import { distanceKm, estimateDurationMin } from "./geocode";

const FALLBACK_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=";

export function avatarUrl(user) {
  if (user?.avatar?.url) return user.avatar.url;
  return `${FALLBACK_AVATAR}${encodeURIComponent(user?.name || "?")}`;
}

function preferenceLabels(prefs = {}) {
  const labels = [];
  labels.push(prefs.smokingAllowed ? "Smoking OK" : "No smoking");
  if (prefs.petsAllowed) labels.push("Pets OK");
  if (prefs.womenOnly) labels.push("Ladies only");
  labels.push(prefs.instantBooking ? "Instant booking" : "Request to book");
  return labels;
}

const STATUS_MAP = { scheduled: "upcoming", ongoing: "ongoing", completed: "completed", cancelled: "cancelled" };

/** Maps a Ride document from the API into the shape the UI components expect. */
export function normalizeRide(ride) {
  if (!ride) return null;
  const km = distanceKm(ride.origin.coordinates, ride.destination.coordinates);
  const departure = new Date(ride.departureTime);

  return {
    id: ride._id,
    _raw: ride,
    driver: {
      id: ride.driver?._id,
      name: ride.driver?.name || "Unknown driver",
      avatar: avatarUrl(ride.driver),
      rating: ride.driver?.ratingAverage ?? 0,
      ratingCount: ride.driver?.ratingCount ?? 0,
      verified: !!ride.vehicle?.isVerified,
      phone: ride.driver?.phone,
    },
    from: ride.origin?.address,
    to: ride.destination?.address,
    date: departure.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }),
    time: departure.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    departureTime: ride.departureTime,
    seatsTotal: ride.totalSeats,
    seatsAvailable: ride.availableSeats,
    price: ride.pricePerSeat,
    distanceKm: Math.round(km * 10) / 10,
    durationMin: estimateDurationMin(km),
    vehicle: ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model} · ${ride.vehicle.color}` : "Vehicle",
    waypoints: [
      ride.origin?.address,
      ...(ride.waypoints || []).map((w) => w.address),
      ride.destination?.address,
    ].filter(Boolean),
    preferences: preferenceLabels(ride.preferences),
    status: STATUS_MAP[ride.status] || ride.status,
    cancellationReason: ride.cancellationReason,
  };
}

export function normalizeBooking(booking) {
  if (!booking) return null;
  return {
    id: booking._id,
    _raw: booking,
    ride: normalizeRide(booking.ride),
    seatsBooked: booking.seatsBooked,
    fare: booking.fare,
    status: booking.status,
    bookedOn: new Date(booking.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    cancellationReason: booking.cancellationReason,
  };
}
