import api from "../lib/api";

export async function createRating({ rideId, toUserId, rating, review }) {
  const res = await api.post("/ratings", { rideId, toUserId, rating, review });
  return res.data.data;
}

export async function getUserRatings(userId) {
  const res = await api.get(`/ratings/user/${userId}`);
  return res.data.data;
}

/** Ratings the logged-in user has already given (used to hide "Rate" once done). */
export async function getMyRatings() {
  const res = await api.get("/ratings/mine");
  return res.data.data;
}
