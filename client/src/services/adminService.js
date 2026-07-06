import api from "../lib/api";

export async function getDashboardStats() {
  const res = await api.get("/admin/dashboard");
  return res.data.data;
}

export async function listUsers({ page = 1, limit = 20, search = "" } = {}) {
  const res = await api.get("/admin/users", { params: { page, limit, search: search || undefined } });
  return res.data.data; // { users, page, totalPages, total }
}

export async function banUser(userId, reason) {
  const res = await api.patch(`/admin/users/${userId}/ban`, { reason });
  return res.data.data;
}

export async function unbanUser(userId) {
  const res = await api.patch(`/admin/users/${userId}/unban`);
  return res.data.data;
}

export async function listRides({ page = 1, limit = 20, status = "" } = {}) {
  const res = await api.get("/admin/rides", { params: { page, limit, status: status || undefined } });
  return res.data.data; // { rides, page, totalPages, total }
}
