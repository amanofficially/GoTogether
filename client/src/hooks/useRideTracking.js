import { useCallback, useEffect, useRef, useState } from "react";
import { createRideSocket } from "../lib/socket";
import { updateRideLocation } from "../services/rideService";

const MIN_SEND_INTERVAL_MS = 8000; // throttle so we don't hammer the API/DB on every GPS tick

/**
 * Driver-side: shares the driver's live position for an ongoing ride.
 * Uses the browser's Geolocation API and pushes throttled updates through
 * the existing `PATCH /api/v1/rides/:id/location` endpoint, which itself
 * broadcasts to everyone in the ride's socket room (see
 * server/src/controllers/rideController.js -> updateRideLocation).
 */
export function useDriverLocationSharing(rideId) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState(null);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setSharing(false);
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't supported on this device or browser.");
      return;
    }
    setError("");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < MIN_SEND_INTERVAL_MS) return;
        lastSentRef.current = now;
        updateRideLocation(rideId, { lat: pos.coords.latitude, lng: pos.coords.longitude })
          .then(() => setLastSentAt(new Date()))
          .catch((err) => {
            setError(err?.response?.data?.message || "Couldn't update your live location.");
          });
      },
      () => {
        setError("Location access was denied. Enable it in your browser to share live location.");
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setSharing(true);
  }, [rideId, stop]);

  // Stop sharing if the component unmounts (e.g. navigating away mid-ride)
  useEffect(() => stop, [stop]);

  return { sharing, start, stop, error, lastSentAt };
}

/**
 * Viewer-side (passenger or driver reviewing their own ride): joins the
 * ride's socket room and listens for `driver:location` broadcasts, so the
 * UI can render a live-updating marker + distance/ETA without polling.
 */
export function useLiveLocationFeed(rideId, enabled) {
  const [location, setLocation] = useState(null); // { coordinates: [lng, lat], timestamp }
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !rideId) return undefined;

    const socket = createRideSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("ride:join", { rideId });
    });
    socket.on("connect_error", () => setConnected(false));
    socket.on("disconnect", () => setConnected(false));
    socket.on("driver:location", (payload) => {
      if (String(payload.rideId) === String(rideId)) setLocation(payload);
    });

    return () => {
      socket.emit("ride:leave", { rideId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [rideId, enabled]);

  return { location, connected };
}
