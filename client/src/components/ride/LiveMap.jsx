import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons reference relative image paths that don't
// resolve correctly once bundled by Vite. Point them at the CDN copies
// instead of trying to bundle the raster assets ourselves.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = L.divIcon({
  className: "",
  html:
    '<div style="width:18px;height:18px;border-radius:50%;background:#FF8A00;' +
    'border:3px solid white;box-shadow:0 0 0 4px rgba(255,138,0,0.35);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * @param {[number, number]} origin - [lng, lat]
 * @param {[number, number]} destination - [lng, lat]
 * @param {[number, number]} [driverPosition] - [lng, lat], live if provided
 * @param {[number, number][]} [routeGeometry] - actual road route as [lng, lat] points (OSRM); falls back to a straight line when absent
 */
export default function LiveMap({
  origin,
  destination,
  driverPosition,
  routeGeometry,
  className = "",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Origin / destination markers + route line + initial fit
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin || !destination) return;

    const originLatLng = [origin[1], origin[0]];
    const destLatLng = [destination[1], destination[0]];

    if (!originMarkerRef.current) {
      originMarkerRef.current = L.marker(originLatLng)
        .addTo(map)
        .bindPopup("Pickup point");
    } else {
      originMarkerRef.current.setLatLng(originLatLng);
    }

    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker(destLatLng)
        .addTo(map)
        .bindPopup("Drop-off point");
    } else {
      destMarkerRef.current.setLatLng(destLatLng);
    }

    if (routeLineRef.current) routeLineRef.current.remove();
    const routeLatLngs =
      routeGeometry && routeGeometry.length > 1
        ? routeGeometry.map(([lng, lat]) => [lat, lng])
        : [originLatLng, destLatLng];
    routeLineRef.current = L.polyline(routeLatLngs, {
      color: "#3D5A73",
      weight: 4,
      opacity: routeGeometry ? 0.75 : 0.55,
      dashArray: routeGeometry ? null : "6 8",
    }).addTo(map);

    const bounds = L.latLngBounds(routeLatLngs);
    if (driverPosition) bounds.extend([driverPosition[1], driverPosition[0]]);
    map.fitBounds(bounds, { padding: [36, 36] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin?.[0],
    origin?.[1],
    destination?.[0],
    destination?.[1],
    routeGeometry,
  ]);

  // Live driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverPosition) return;
    const latLng = [driverPosition[1], driverPosition[0]];

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(latLng, {
        icon: driverIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup("Driver's live location");
    } else {
      driverMarkerRef.current.setLatLng(latLng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPosition?.[0], driverPosition?.[1]]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden rounded-xl ${className}`}
      style={{ minHeight: 240 }}
    />
  );
}
