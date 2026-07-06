/**
 * Lightweight address -> coordinates geocoding using OpenStreetMap's free
 * Nominatim API. No API key needed, which keeps local/dev setup simple.
 *
 * NOTE for production: Nominatim's public instance has a strict usage policy
 * (max ~1 request/sec, no heavy traffic). For a production deployment with
 * real user volume, swap this out for a paid provider (Google Places,
 * Mapbox, etc.) — the rest of the app only depends on the
 * `{ label, lat, lng }` shape returned below, so the swap is a one-file change.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(query) {
  if (!query || !query.trim()) return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("Could not look up that location. Please try again.");

  const results = await res.json();
  if (!results.length) return null;

  const place = results[0];
  return {
    label: place.display_name,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
  };
}

/** Great-circle distance in km between two [lng, lat] points (Haversine formula). */
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Rough travel time estimate assuming ~28 km/h average city traffic speed. */
export function estimateDurationMin(km) {
  return Math.max(5, Math.round((km / 28) * 60));
}

const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Looks up the actual road route between two points using OSRM's free
 * public routing API (no key needed, same OSM ecosystem as the Nominatim
 * geocoder above). Falls back gracefully — callers should catch/ignore
 * failures and keep using the Haversine `distanceKm` estimate, since OSRM's
 * public demo server has no uptime guarantee.
 *
 * @param {[number, number]} origin - [lng, lat]
 * @param {[number, number]} destination - [lng, lat]
 * @returns {Promise<{ distanceKm: number, durationMin: number, geometry: [number, number][] } | null>}
 */
export async function getRoute(origin, destination) {
  const url = `${OSRM_ROUTE_URL}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not calculate the road route.");

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    geometry: route.geometry.coordinates, // [ [lng, lat], ... ]
  };
}
