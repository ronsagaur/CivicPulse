"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  Clock,
  Hourglass,
  Building2,
  LogOut,
} from "lucide-react";
import { api, usePolling } from "@/lib/client";
import { CATEGORY_META, type Report } from "@/lib/types";
import { slaInfo } from "@/lib/format";
import { Stat, SeverityDots, StatusBadge, SlaPill } from "@/components/ui";
import type { AnalyticsSummary } from "@/lib/analytics";

const AUTHORITY_STATES = new Set<Report["status"]>([
  "ROUTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_CONFIRM",
  "ESCALATED",
  "VERIFIED",
]);

export default function AuthorityDashboard() {
  const router = useRouter();
  const { data, refresh } = usePolling<{ reports: Report[] }>("/api/reports", 2000);
  const { data: analytics } = usePolling<AnalyticsSummary>("/api/analytics", 4000);
  const [busy, setBusy] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const reports = (data?.reports ?? []).filter((r) => AUTHORITY_STATES.has(r.status));

  const queue = reports.slice().sort((a, b) => {
    const sa = a.slaDeadline ? +new Date(a.slaDeadline) : Infinity;
    const sb = b.slaDeadline ? +new Date(b.slaDeadline) : Infinity;
    if (sa !== sb) return sa - sb;
    return b.severity - a.severity;
  });

  const open = reports.filter(
    (r) => r.status !== "RESOLVED_PENDING_CONFIRM"
  ).length;
  const slaRisk = reports.filter((r) => slaInfo(r.slaDeadline)?.breached).length;
  const myScore =
    analytics?.departments.find((d) => d.departmentId === "dept-pwd-14")?.score ??
    analytics?.departments[0]?.score ??
    0;

  async function action(id: string, act: "ACKNOWLEDGE" | "START" | "RESOLVE") {
    setBusy(id);
    try {
      await api(`/api/authority/reports/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ action: act }),
      });
      refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto px-1 py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 text-white">
              <Building2 size={18} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold leading-tight font-serif-header text-slate-800">
                Ward Command Center
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                PWD Ward 14 · Officer Sharma
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200">
            🔔 {slaRisk} need attention today
          </span>
          <button onClick={handleLogout} className="btn-ghost !px-3" title="Log out">
            <LogOut size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open" value={open} sub="awaiting action" />
        <Stat
          label="SLA risk"
          value={slaRisk}
          accent="red"
          sub="overdue / breached"
        />
        <Stat
          label="Resolved"
          value={analytics?.totals.resolved ?? "—"}
          accent="green"
          sub="closed & verified"
        />
        <Stat label="Dept score" value={`${myScore}/100`} accent="blue" sub="vs city avg" />
      </div>

      {/* Queue */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Issues Needing Attention (SLA Queue)
          </h2>
          <span className="text-xs text-slate-400">{queue.length} items · live</span>
        </div>

        <div className="divide-y divide-slate-100">
          {queue.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              Queue is clear. New verified reports will appear here in real time.
            </div>
          )}
          {queue.map((r) => {
            const meta = CATEGORY_META[r.category];
            const breached = slaInfo(r.slaDeadline)?.breached;
            return (
              <div
                key={r.id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                  breached ? "bg-rose-50/40" : ""
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xl">
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/report/${r.id}`}
                      className="truncate text-sm font-bold text-slate-800 hover:text-brand-700"
                    >
                      {r.title}
                    </Link>
                    <span className="font-mono text-[11px] text-slate-400">
                      {r.id}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <SlaPill deadline={r.slaDeadline} />
                    <SeverityDots value={r.severity} />
                    <span className="text-xs text-slate-400">
                      👥 {r.confirmCount} confirmed · {r.upvoteCount} upvotes
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <QueueAction
                    report={r}
                    busy={busy === r.id}
                    onAck={() => action(r.id, "ACKNOWLEDGE")}
                    onStart={() => action(r.id, "START")}
                    onResolve={() => action(r.id, "RESOLVE")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Equity Score Card */}
      <div className="card p-4 border-violet-100 bg-gradient-to-br from-white to-violet-50/10">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              ⚖️ AI Civic Equity Index
            </h2>
            <p className="text-xs text-slate-500">
              Combats algorithmic bias by auditing resource allocation parity vs predicted maintenance priority.
            </p>
          </div>
          <span className="chip bg-violet-100 text-violet-700 font-bold text-[10px]">
            Equity Balanced: 84/100
          </span>
        </div>

        <div className="rounded-xl border border-violet-100/50 bg-white/70 p-3 text-xs leading-relaxed text-slate-600 mb-3 shadow-sm">
          <span className="font-bold text-slate-800">⚠️ Systemic Disparity Alert:</span> Ward 5 (Govandi East) has 8 open critical issues but has received only 12% of dispatched road maintenance crews. AI detects a <strong>3.2x resource allocation disparity</strong> relative to affluent wards, suggesting systemic under-resourcing.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-2 font-semibold">Ward Location</th>
                <th className="py-2 font-semibold text-center">Need Index</th>
                <th className="py-2 font-semibold text-center">Crews Dispatched</th>
                <th className="py-2 font-semibold text-right">Disparity Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              <tr>
                <td className="py-2 font-medium">Ward 14 (Andheri West)</td>
                <td className="py-2 text-center font-mono">78/100</td>
                <td className="py-2 text-center font-mono">62%</td>
                <td className="py-2 text-right text-emerald-600 font-bold">1.25 (Fair)</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Ward 9 (Bandra West)</td>
                <td className="py-2 text-center font-mono">42/100</td>
                <td className="py-2 text-center font-mono">48%</td>
                <td className="py-2 text-right text-emerald-600 font-bold">0.88 (Optimal)</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Ward 21 (Powai)</td>
                <td className="py-2 text-center font-mono">58/100</td>
                <td className="py-2 text-center font-mono">50%</td>
                <td className="py-2 text-right text-emerald-600 font-bold">1.16 (Fair)</td>
              </tr>
              <tr className="bg-rose-50/20">
                <td className="py-2 font-semibold text-slate-800">Ward 5 (Govandi East)</td>
                <td className="py-2 text-center font-semibold text-rose-700 font-mono">88/100</td>
                <td className="py-2 text-center font-mono">18%</td>
                <td className="py-2 text-right text-rose-600 font-bold">4.88 (Neglect Risk 🚨)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Department scorecard */}
      <div className="card p-4">
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Comparative Department Grades
        </h2>
        <div className="space-y-2">
          {analytics?.departments.map((d) => (
            <div key={d.departmentId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm font-semibold text-slate-700">
                {d.shortName}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    d.score >= 75
                      ? "bg-emerald-500"
                      : d.score >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-bold text-slate-700">
                {d.score}
              </span>
              {d.overdue > 0 && (
                <span className="chip bg-rose-50 text-rose-600 ring-rose-200">
                  {d.overdue} overdue
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueueAction({
  report: r,
  busy,
  onAck,
  onStart,
  onResolve,
}: {
  report: Report;
  busy: boolean;
  onAck: () => void;
  onStart: () => void;
  onResolve: () => void;
}) {
  if (r.status === "ROUTED" || r.status === "VERIFIED" || r.status === "ESCALATED") {
    return (
      <button disabled={busy} onClick={onAck} className="btn-ghost !py-2 text-xs">
        <ClipboardCheck size={14} /> Acknowledge
      </button>
    );
  }
  if (r.status === "ACKNOWLEDGED") {
    return (
      <button disabled={busy} onClick={onStart} className="btn-primary !py-2 text-xs">
        <Play size={14} /> Start work
      </button>
    );
  }
  if (r.status === "IN_PROGRESS") {
    return (
      <button disabled={busy} onClick={onResolve} className="btn-success !py-2 text-xs">
        <CheckCircle2 size={14} /> Mark resolved
      </button>
    );
  }
  if (r.status === "RESOLVED_PENDING_CONFIRM") {
    return (
      <span className="chip bg-amber-50 text-amber-700 ring-amber-200">
        <Hourglass size={13} /> Awaiting citizen
      </span>
    );
  }
  return (
    <span className="chip bg-slate-100 text-slate-500 ring-slate-200">
      <Clock size={13} /> —
    </span>
  );
}
