import api from "../lib/api";
import { normalizeBooking } from "../lib/normalize";

export async function createBooking({ rideId, seatsBooked, pickupPoint }) {
  const res = await api.post("/bookings", { rideId, seatsBooked, pickupPoint });
  return res.data.data;
}

export async function getMyBookings() {
  const res = await api.get("/bookings/me");
  return res.data.data.map(normalizeBooking);
}

export async function getBookingsForRide(rideId) {
  const res = await api.get(`/bookings/ride/${rideId}`);
  return res.data.data;
}

export async function respondToBooking(bookingId, action) {
  const res = await api.patch(`/bookings/${bookingId}/respond`, { action });
  return res.data.data;
}

export async function cancelBooking(bookingId, reason) {
  const res = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
  return res.data.data;
}
