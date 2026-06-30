"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { Report, IssueCategory } from "@/lib/types";
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    let active = true;
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places"],
    });

    (loader as any).load().then(() => {
      if (!active || !elRef.current || mapRef.current) return;

      const map = new google.maps.Map(elRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        // Premium clean styling - hides busy POIs to make civic markers pop
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "road",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapRef.current = map;
      renderMarkers();
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when data or heat layer changes
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, heat]);

  function renderMarkers() {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear old circles
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    reports.forEach((r) => {
      const color = colorFor(r.status);
      const meta = CATEGORY_META[r.category as IssueCategory] || CATEGORY_META.OTHER;

      // Draw heat-radius overlays if enabled
      if (heat) {
        const circle = new google.maps.Circle({
          strokeWeight: 0,
          fillColor: color,
          fillOpacity: 0.15,
          map: map,
          center: { lat: r.location.lat, lng: r.location.lng },
          radius: 60 + r.severity * 50 + Math.min(r.upvoteCount, 30) * 5,
        });
        circlesRef.current.push(circle);
      }

      // Native Google Maps Marker with custom categories icon url
      const marker = new google.maps.Marker({
        position: { lat: r.location.lat, lng: r.location.lng },
        map: map,
        title: r.title,
        icon: {
          url: meta.iconPath,
          scaledSize: new google.maps.Size(36, 36),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(18, 36),
        },
      });

      markersRef.current.push(marker);

      // Info Window containing ticket overview and tracking link
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="min-width:180px; font-family: system-ui, sans-serif; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 18px;">${meta.emoji}</span>
              <div style="font-weight: 800; color: #1e293b; font-size: 12px; line-height: 1.2;">
                ${escapeHtml(r.title)}
              </div>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
              📍 ${escapeHtml(r.addressText)}
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 8px;">
              ${STATUS_META[r.status].label} · Severity ${r.severity}/5
            </div>
            <a href="/report/${r.id}" style="display: inline-block; font-size: 10px; font-weight: 700; color: #2563eb; text-decoration: none; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px; background-color: #f8fafc;">
              Track Audit Timeline →
            </a>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });
    });
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
