"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Report } from "@/lib/types";
import { CATEGORY_META, STATUS_META } from "@/lib/types";

function colorFor(status: Report["status"]): string {
  switch (status) {
    case "CLOSED_VERIFIED":
      return "#10b981";
    case "IN_PROGRESS":
    case "ACKNOWLEDGED":
    case "ROUTED":
    case "VERIFIED":
    case "RESOLVED_PENDING_CONFIRM":
      return "#f59e0b";
    case "ESCALATED":
      return "#e11d48";
    case "REJECTED":
      return "#94a3b8";
    default:
      return "#ef4444"; // pending verification
  }
}

export default function MapView({
  reports,
  center,
  zoom = 14,
  height = 420,
  heat = false,
}: {
  reports: Report[];
  center: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  heat?: boolean;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const router = useRouter();

  // init once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        attribution: "© Google Maps",
        maxZoom: 20,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      renderMarkers(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-render markers when data changes
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      if (mapRef.current) renderMarkers(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, heat]);

  async function renderMarkers(L: any) {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const r of reports) {
      const color = colorFor(r.status);
      if (heat) {
        L.circle([r.location.lat, r.location.lng], {
          radius: 60 + r.severity * 55 + Math.min(r.upvoteCount, 40) * 6,
          color,
          weight: 0,
          fillColor: color,
          fillOpacity: 0.18,
        }).addTo(layer);
      }
      const meta = CATEGORY_META[r.category];
      const customIcon = L.icon({
        iconUrl: meta.iconPath,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -38],
        className: 'rounded-xl shadow-xl border-2 border-white bg-white transition-transform hover:scale-110 object-cover'
      });

      const marker = L.marker([r.location.lat, r.location.lng], {
        icon: customIcon,
      }).addTo(layer);

      marker.bindPopup(
        `<div style="min-width:190px; font-family: var(--font-sans);">
           <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
             <img src="${meta.iconPath}" alt="${meta.label}" style="width: 24px; height: 24px; object-fit: contain;" />
             <div style="font-weight:700; color:#1e1b18; font-size:13px;">${escapeHtml(r.title)}</div>
           </div>
           <div style="font-size:11px; color:#64748b">${escapeHtml(r.addressText)}</div>
           <div style="font-size:11px; margin-top:6px; font-weight:600; color:#475569;">
             ${STATUS_META[r.status].label} · Sev ${r.severity}
           </div>
           <a href="/report/${r.id}" style="display:inline-block; margin-top:8px; font-size:11px; font-weight:700; color:#c2593f; text-decoration: none;">
             Track Audit Timeline →
           </a>
         </div>`
      );
      marker.on("click", () => marker.openPopup());
    }
  }

  return (
    <div
      ref={elRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
