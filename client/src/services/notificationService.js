import api from "../lib/api";

export async function getMyNotifications({ page = 1, limit = 20 } = {}) {
  const res = await api.get("/notifications", { params: { page, limit } });
  return res.data.data; // { notifications, unreadCount, page, totalPages }
}

export async function markAsRead(id) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.data;
}

export async function markAllAsRead() {
  const res = await api.patch("/notifications/read-all");
  return res.data.message;
}
