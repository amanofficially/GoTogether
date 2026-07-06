import api, { setAccessToken, clearAccessToken } from "../lib/api";

export async function getMe() {
  const res = await api.get("/users/me");
  return res.data.data;
}

export async function updateMe(updates) {
  const res = await api.patch("/users/me", updates);
  return res.data.data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data; // { avatar: { url, publicId } }
}

export async function getPublicProfile(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data.data;
}

export async function getMyVehicles() {
  const res = await api.get("/users/me/vehicles");
  return res.data.data;
}

export async function addVehicle(vehicle) {
  const res = await api.post("/users/me/vehicles", vehicle);
  return res.data.data;
}

export async function deleteVehicle(vehicleId) {
  const res = await api.delete(`/users/me/vehicles/${vehicleId}`);
  return res.data.message;
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await api.patch("/users/me/password", { currentPassword, newPassword });
  const token = res.data?.data?.accessToken;
  if (token) setAccessToken(token);
  return res.data.message;
}

export async function deleteAccount({ password }) {
  const res = await api.delete("/users/me", { data: { password } });
  clearAccessToken();
  return res.data.message;
}
