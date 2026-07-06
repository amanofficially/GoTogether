import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { trySilentRefresh, onUnauthorized } from "../lib/api";
import * as authService from "../services/authService";
import * as userService from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // On first load, try to silently restore a session using the httpOnly
  // refresh cookie (no token is ever kept in localStorage). If it succeeds,
  // fetch the current profile; otherwise the user is simply signed out.
  useEffect(() => {
    (async () => {
      const token = await trySilentRefresh();
      if (token) {
        try {
          const me = await userService.getMe();
          if (mounted.current) setUser(me);
        } catch {
          if (mounted.current) setUser(null);
        }
      }
      if (mounted.current) setInitializing(false);
    })();
  }, []);

  // If any request comes back 401 after a failed refresh (e.g. session
  // expired or was revoked elsewhere), clear local state so the UI reacts.
  useEffect(() => {
    return onUnauthorized(() => {
      if (mounted.current) setUser(null);
    });
  }, []);

  const register = useCallback(async (data) => {
    return authService.register(data); // { userId, email } — account is pending OTP verification
  }, []);

  const verifyOtp = useCallback(async ({ email, otp }) => {
    const loggedInUser = await authService.verifyOtp({ email, otp });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const resendOtp = useCallback(async (email) => {
    return authService.resendOtp({ email });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email) => authService.forgotPassword({ email }), []);

  const resetPassword = useCallback(
    async ({ email, otp, newPassword }) => authService.resetPassword({ email, otp, newPassword }),
    []
  );

  const refreshUser = useCallback(async () => {
    const me = await userService.getMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      initializing,
      register,
      verifyOtp,
      resendOtp,
      login,
      logout,
      forgotPassword,
      resetPassword,
      refreshUser,
      setUser,
    }),
    [user, initializing, register, verifyOtp, resendOtp, login, logout, forgotPassword, resetPassword, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
