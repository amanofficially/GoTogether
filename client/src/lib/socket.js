import { io } from "socket.io-client";
import { getAccessToken } from "./api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

/**
 * Creates a fresh, authenticated socket connection. The server authenticates
 * the handshake using the same short-lived access token as REST calls (see
 * server/src/sockets/socketHandler.js), so a socket is only ever created
 * on demand (e.g. opening a ride chat) and torn down when no longer needed,
 * rather than kept alive globally.
 */
export function createRideSocket() {
  const token = getAccessToken();
  const socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
  return socket;
}
