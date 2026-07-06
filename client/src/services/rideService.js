import api from "../lib/api";
import { normalizeRide } from "../lib/normalize";

/**
 * @param {object} params
 * @param {{lat:number,lng:number}} [params.origin]
 * @param {{lat:number,lng:number}} [params.destination]
 * @param {string} [params.date] - ISO date (yyyy-mm-dd)
 * @param {number} [params.seats]
 */
export async function searchRides({ origin, destination, date, seats } = {}) {
  const params = {};
  if (origin) {
    params.originLng = origin.lng;
    params.originLat = origin.lat;
  }
  if (destination) {
    params.destinationLng = destination.lng;
    params.destinationLat = destination.lat;
  }
  if (date) params.date = date;
  if (seats) params.seats = seats;

  const res = await api.get("/rides/search", { params });
  return res.data.data.map(normalizeRide);
}

export async function getRideById(id) {
  const res = await api.get(`/rides/${id}`);
  return normalizeRide(res.data.data);
}

export async function getMyOfferedRides() {
  const res = await api.get("/rides/me/offered");
  return res.data.data.map(normalizeRide);
}

/**
 * @param {object} payload
 * @param {string} payload.vehicle - vehicle id
 * @param {{address:string, lat:number, lng:number}} payload.origin
 * @param {{address:string, lat:number, lng:number}} payload.destination
 * @param {string} payload.departureTime - ISO datetime
 * @param {number} payload.totalSeats
 * @param {number} payload.pricePerSeat
 * @param {object} [payload.preferences]
 */
export async function createRide(payload) {
  const body = {
    vehicle: payload.vehicle,
    origin: { address: payload.origin.address, coordinates: [payload.origin.lng, payload.origin.lat] },
    destination: {
      address: payload.destination.address,
      coordinates: [payload.destination.lng, payload.destination.lat],
    },
    departureTime: payload.departureTime,
    totalSeats: payload.totalSeats,
    pricePerSeat: payload.pricePerSeat,
    preferences: payload.preferences,
  };
  const res = await api.post("/rides", body);
  return normalizeRide(res.data.data);
}

export async function updateRideStatus(rideId, status, reason) {
  const res = await api.patch(`/rides/${rideId}/status`, { status, reason });
  return normalizeRide(res.data.data);
}

export async function updateRideLocation(rideId, { lat, lng }) {
  const res = await api.patch(`/rides/${rideId}/location`, { lat, lng });
  return res.data.data;
}
