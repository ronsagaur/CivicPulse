import type { ReportStatus } from "./types";

export function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export interface SlaInfo {
  label: string;
  tone: "green" | "amber" | "red";
  breached: boolean;
}

export function slaInfo(deadlineIso?: string): SlaInfo | null {
  if (!deadlineIso) return null;
  const diff = +new Date(deadlineIso) - Date.now();
  const hours = diff / 3600000;
  if (diff < 0) {
    const overdueH = Math.abs(Math.round(hours));
    return {
      label: overdueH >= 24 ? `OVERDUE ${Math.round(overdueH / 24)}d` : `OVERDUE ${overdueH}h`,
      tone: "red",
      breached: true,
    };
  }
  if (hours < 24)
    return { label: `${Math.round(hours)}h left`, tone: "amber", breached: false };
  return { label: `${Math.round(hours / 24)}d left`, tone: "green", breached: false };
}

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function toneClass(tone: string): string {
  return TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;
}

// Order of the happy-path lifecycle for progress rendering.
export const LIFECYCLE_ORDER: ReportStatus[] = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "ROUTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_CONFIRM",
  "CLOSED_VERIFIED",
];

export function lifecycleProgress(status: ReportStatus): number {
  if (status === "REJECTED") return 0;
  if (status === "ESCALATED") return 5; // reopened mid-pipeline
  const idx = LIFECYCLE_ORDER.indexOf(status);
  return idx < 0 ? 0 : idx + 1;
}
