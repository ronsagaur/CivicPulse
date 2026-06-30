"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export async function api<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("401 Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Polls an endpoint on an interval — our lightweight stand-in for the
 * WebSocket live-updates in the blueprint. Two browser windows polling the
 * same store produce the "live" cross-device effect during the demo.
 */
export function usePolling<T>(
  path: string | null,
  intervalMs = 2500
): { data: T | null; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const pathRef = useRef(path);
  pathRef.current = path;

  const load = useCallback(async () => {
    const p = pathRef.current;
    if (!p) return;
    try {
      const json = await api<T>(p);
      setData(json);
    } catch {
      /* keep last good data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!path) return;
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [path, intervalMs, load]);

  return { data, loading, refresh: load };
}
