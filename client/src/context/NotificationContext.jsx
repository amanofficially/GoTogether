import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createRideSocket } from "../lib/socket";
import { getMyNotifications, markAsRead as markAsReadApi, markAllAsRead as markAllAsReadApi } from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

/**
 * Keeps one long-lived authenticated socket open for the whole session
 * (separate from the per-ride chat sockets created in ChatPanel) purely to
 * receive `notification:new` events the server pushes from
 * bookingController.js. This gives the bell icon and toast a real-time feed
 * instead of only refreshing on a page visit / polling interval.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const socketRef = useRef(null);
  const toastTimeout = useRef(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getMyNotifications({ limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently ignore — the notifications page itself surfaces load errors.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refresh();

    const socket = createRideSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("notification:new", (notification) => {
      setNotifications((cur) => [notification, ...cur]);
      setUnreadCount((cur) => cur + 1);
      setToast(notification);
      clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 5000);
    });

    return () => {
      clearTimeout(toastTimeout.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, refresh]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((cur) => cur.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((cur) => Math.max(0, cur - 1));
    try {
      await markAsReadApi(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((cur) => cur.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllAsReadApi();
    } catch {
      refresh();
    }
  }, [refresh]);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({ notifications, unreadCount, toast, refresh, markAsRead, markAllAsRead, dismissToast }),
    [notifications, unreadCount, toast, refresh, markAsRead, markAllAsRead, dismissToast]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
