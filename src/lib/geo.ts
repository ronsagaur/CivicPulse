import type { GeoPoint } from "./types";

/** Haversine distance in metres between two lat/lng points. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Nudge a point by up to ~`meters` in a random direction (for demo spread). */
export function jitter(p: GeoPoint, meters: number): GeoPoint {
  const dLat = (Math.random() - 0.5) * (meters / 111111) * 2;
  const dLng =
    (Math.random() - 0.5) *
    (meters / (111111 * Math.cos(toRad(p.lat)))) *
    2;
  return { lat: p.lat + dLat, lng: p.lng + dLng };
}
