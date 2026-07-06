import api, { setAccessToken, clearAccessToken } from "../lib/api";

export async function register({ name, email, phone, password }) {
  const res = await api.post("/auth/register", { name, email, phone, password });
  return res.data.data; // { userId, email }
}

export async function verifyOtp({ email, otp }) {
  const res = await api.post("/auth/verify-otp", { email, otp });
  const { accessToken, user } = res.data.data;
  setAccessToken(accessToken);
  return user;
}

export async function resendOtp({ email }) {
  const res = await api.post("/auth/resend-otp", { email });
  return res.data.message;
}

export async function login({ email, password }) {
  const res = await api.post("/auth/login", { email, password });
  const { accessToken, user } = res.data.data;
  setAccessToken(accessToken);
  return user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export async function forgotPassword({ email }) {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data.message;
}

export async function resetPassword({ email, otp, newPassword }) {
  const res = await api.post("/auth/reset-password", { email, otp, newPassword });
  return res.data.message;
}
