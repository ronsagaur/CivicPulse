import Link from "next/link";
import {
  CATEGORY_META,
  STATUS_META,
  type IssueCategory,
  type ReportStatus,
} from "@/lib/types";
import { slaInfo, toneClass } from "@/lib/format";

export function StatusBadge({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`chip ${toneClass(meta.tone)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export function CategoryChip({ category }: { category: IssueCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="chip bg-slate-100 text-slate-700 ring-slate-200">
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function SeverityDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Severity ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= value
              ? value >= 4
                ? "bg-rose-500"
                : value >= 3
                ? "bg-amber-500"
                : "bg-emerald-500"
              : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

export function SlaPill({ deadline }: { deadline?: string }) {
  const info = slaInfo(deadline);
  if (!info) return null;
  const cls =
    info.tone === "red"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : info.tone === "amber"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return <span className={`chip ${cls}`}>⏱ {info.label}</span>;
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "blue" | "green" | "amber" | "red";
}) {
  const accentCls =
    accent === "green"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : accent === "red"
      ? "text-rose-600"
      : "text-brand-700";
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${accentCls}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < current ? "bg-brand-600" : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

export function TrustBadge({ score }: { score: number }) {
  const band = score <= 30 ? "New" : score <= 70 ? "Trusted" : "Champion";
  const cls =
    band === "Champion"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : band === "Trusted"
      ? "bg-brand-50 text-brand-700 ring-brand-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`chip ${cls}`} title={`Trust ${score}/100 · ${band}`}>
      🛡️ {score} · {band}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
    >
      ← {label}
    </Link>
  );
}

export function AnimatedPulseLine({ score = 75 }: { score?: number }) {
  const speed = score >= 85 ? "1.2s" : score >= 70 ? "1.8s" : score >= 50 ? "2.8s" : "4.2s";
  const strokeColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  
  return (
    <svg className="w-24 h-8 opacity-75 overflow-visible select-none" viewBox="0 0 100 30" aria-hidden="true">
      <path
        d="M 0 15 H 20 L 25 5 L 30 25 L 35 12 L 40 18 L 45 15 H 100"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
        style={{
          animationDuration: speed,
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}
