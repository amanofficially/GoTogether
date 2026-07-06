import api from "../lib/api";

export async function getMessages(rideId, { page = 1, limit = 50 } = {}) {
  const res = await api.get(`/chat/${rideId}/messages`, { params: { page, limit } });
  return res.data.data;
}
