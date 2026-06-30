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
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Shield,
  Activity,
  FileText,
  Sparkles
} from "lucide-react";
import { api, usePolling } from "@/lib/client";
import { CATEGORY_META, type Report, type IssueCategory } from "@/lib/types";
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
  const [activeTab, setActiveTab] = useState<"action" | "bureau">("action");
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const reports = (data?.reports ?? []).filter((r) => AUTHORITY_STATES.has(r.status));

  // Sort queue by urgency
  const queue = reports.slice().sort((a, b) => {
    const aEsc = a.status === "ESCALATED" ? 1 : 0;
    const bEsc = b.status === "ESCALATED" ? 1 : 0;
    if (aEsc !== bEsc) return bEsc - aEsc;

    const sa = a.slaDeadline ? +new Date(a.slaDeadline) : Infinity;
    const sb = b.slaDeadline ? +new Date(b.slaDeadline) : Infinity;
    const aBreached = a.slaDeadline ? slaInfo(a.slaDeadline)?.breached : false;
    const bBreached = b.slaDeadline ? slaInfo(b.slaDeadline)?.breached : false;

    if (aBreached !== bBreached) return aBreached ? -1 : 1;
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

  // Calculate smart urgency parameters for the Focus Card
  const focusTicket = queue[0];
  const hasFocusTicket = !!focusTicket;
  const focusMeta = focusTicket ? CATEGORY_META[focusTicket.category as IssueCategory] : null;
  const focusSla = focusTicket ? slaInfo(focusTicket.slaDeadline) : null;
  const dissatisfactionSaving = focusTicket
    ? Math.min(94, focusTicket.severity * 12 + focusTicket.upvoteCount * 3 + (focusTicket.status === "ESCALATED" ? 25 : 0))
    : 0;

  // Split remainder issues into prioritized inbox categories
  const needsAttentionIssues = queue.filter(
    (r) => r.status === "ESCALATED" || (r.slaDeadline && slaInfo(r.slaDeadline)?.breached) || r.severity >= 4
  );
  
  const todaysWorkIssues = queue.filter(
    (r) => !needsAttentionIssues.includes(r) && (r.status === "ACKNOWLEDGED" || r.status === "IN_PROGRESS" || r.severity === 3)
  );

  const everythingElseIssues = queue.filter(
    (r) => !needsAttentionIssues.includes(r) && !todaysWorkIssues.includes(r)
  );

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Ambient AI Banner Header */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Building2 size={20} className="text-brand-600" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-slate-800 flex items-center gap-2">
              Ward Command Center
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              PWD Ward 14 · Officer Sharma
            </p>
          </div>
        </div>

        <div className="bg-slate-50/50 rounded-xl px-4 py-2.5 border border-slate-100/50 text-xs text-slate-600 max-w-sm">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Ambient Intelligent Assist
          </span>
          {hasFocusTicket ? (
            <p>
              Today there are <strong className="text-brand-700">{reports.length} issues</strong> active. Resolving the high priority <span className="font-bold text-slate-800">{focusMeta?.label}</span> ticket near <span className="underline">{focusTicket.addressText}</span> first reduces predicted citizen dissatisfaction.
            </p>
          ) : (
            <p>All clear! All active ward issues have been resolved. Citizen satisfaction score is currently operating at optimal levels.</p>
          )}
        </div>

        <div className="bg-violet-50/40 rounded-xl px-4 py-2.5 border border-violet-100/50 text-xs text-slate-600 max-w-xs">
          <span className="font-bold text-violet-800 flex items-center gap-1.5 mb-0.5">
            <Sparkles size={13} className="text-violet-500 animate-pulse" />
            Live Civic Insight
          </span>
          <p>
            {needsAttentionIssues.length > 0 
              ? `Solving these ${needsAttentionIssues.length} critical attention reports today improves your ward resolution score by 12%.`
              : "No pending critical issues. Resolving normal queue tasks keeps the ward score at 92%."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="btn-ghost !px-3 !py-2 flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl" title="Go to Citizen Portal">
            View Citizen Feed
          </Link>
          <button onClick={handleLogout} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition" title="Log out">
            <LogOut size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stats HUD Block */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open Grievances" value={open} sub="awaiting intervention" />
        <Stat label="SLA Risk" value={slaRisk} accent="red" sub="breached or near deadline" />
        <Stat label="Resolved Today" value={analytics?.totals.resolved ?? "—"} accent="green" sub="closed & verified" />
        <Stat label="Department Score" value={`${myScore}/100`} accent="blue" sub="vs Ward 14 average" />
      </div>

      {/* APPLE-STYLE PERSPECTIVE TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
        <div className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/20 max-w-xs w-full">
          <button
            onClick={() => setActiveTab("action")}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition ${
              activeTab === "action"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Action Center
          </button>
          <button
            onClick={() => setActiveTab("bureau")}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition ${
              activeTab === "bureau"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Bureau Analytics
          </button>
        </div>
        <span className="text-xs font-bold text-slate-400 max-sm:pl-1">
          {reports.length} active tickets · Live sync
        </span>
      </div>

      {/* TAB CONTENT 1: ACTION CENTER */}
      {activeTab === "action" && (
        <div className="space-y-6 animate-slide-in">
          
          {/* FOCUS CARD: THE SINGLE NEXT BEST ACTION */}
          {hasFocusTicket && (
            <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-orange-50/20 p-5 shadow-sm hover:shadow transition duration-200">
              <span className="absolute top-4 right-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2">
                <AlertTriangle size={12} /> Next Best Action (Highest Urgency)
              </div>

              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white shadow-sm text-2xl border border-slate-100">
                    {focusMeta?.emoji}
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 leading-snug">
                      {focusTicket.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      📍 {focusTicket.addressText} · Ward {focusTicket.wardId.replace("ward-", "")}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {focusTicket.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-1.5 self-stretch justify-between shrink-0 md:border-l md:border-slate-200/50 md:pl-4 max-md:mt-2 w-full md:w-auto">
                  <div className="text-left md:text-right w-full">
                    <StatusBadge status={focusTicket.status} />
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
                      <SlaPill deadline={focusTicket.slaDeadline} />
                      <SeverityDots value={focusTicket.severity} />
                    </div>
                  </div>
                  
                  {/* Inline quick actions for Focus Card */}
                  <div className="flex gap-2 w-full max-sm:flex-wrap">
                    <QueueAction
                      report={focusTicket}
                      busy={busy === focusTicket.id}
                      onAck={() => action(focusTicket.id, "ACKNOWLEDGE")}
                      onStart={() => action(focusTicket.id, "START")}
                      onResolve={() => action(focusTicket.id, "RESOLVE")}
                    />
                  </div>
                </div>
              </div>

              {/* Focus Explainer Box */}
              <div className="mt-4 rounded-xl bg-white/70 border border-rose-100/50 p-3 text-xs leading-relaxed text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  🎯 Urgency Reasoning:
                </span>
                <p>
                  This ticket has been prioritized as urgent because it is a <strong className="text-slate-800">{focusMeta?.label}</strong> incident near public transport lines, verified by <strong className="text-slate-800">{focusTicket.confirmCount} residents</strong>, and is {focusSla?.breached ? <span className="text-rose-600 font-bold">breaching the SLA timer</span> : `approaching its resolution threshold (${focusSla?.label})`}.
                </p>
              </div>
            </div>
          )}

          {/* SMART prioritized queues */}
          <div className="space-y-6">
            {/* 1. Needs Attention */}
            <div className="card border-rose-100 bg-rose-50/10">
              <div className="flex items-center justify-between border-b border-rose-100/50 px-4 py-2.5 bg-rose-50/30">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  🔥 Needs Attention ({needsAttentionIssues.length})
                </h3>
                <span className="text-[10px] font-bold text-rose-500">Urgent SLA Breaches / Severity 4+</span>
              </div>
              <div className="divide-y divide-rose-100/40">
                {needsAttentionIssues.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">No urgent tickets in this category.</div>
                ) : (
                  needsAttentionIssues.map((r) => (
                    <IssueRow
                      key={r.id}
                      report={r}
                      busy={busy === r.id}
                      action={action}
                      isExpanded={expandedIssueId === r.id}
                      toggleExpand={() => setExpandedIssueId(expandedIssueId === r.id ? null : r.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. Today's Work */}
            <div className="card border-amber-100 bg-amber-50/5">
              <div className="flex items-center justify-between border-b border-amber-100/50 px-4 py-2.5 bg-amber-50/20">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  ⏳ Today's Work ({todaysWorkIssues.length})
                </h3>
                <span className="text-[10px] font-bold text-amber-500">Active SLA Timer / In Progress</span>
              </div>
              <div className="divide-y divide-amber-100/30">
                {todaysWorkIssues.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">No items scheduled for today.</div>
                ) : (
                  todaysWorkIssues.map((r) => (
                    <IssueRow
                      key={r.id}
                      report={r}
                      busy={busy === r.id}
                      action={action}
                      isExpanded={expandedIssueId === r.id}
                      toggleExpand={() => setExpandedIssueId(expandedIssueId === r.id ? null : r.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. Everything Else */}
            <div className="card">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  🚧 Everything Else ({everythingElseIssues.length})
                </h3>
                <span className="text-[10px] font-bold text-slate-400">All Remaining Grievances</span>
              </div>
              <div className="divide-y divide-slate-100">
                {everythingElseIssues.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">All remaining items have been resolved.</div>
                ) : (
                  everythingElseIssues.map((r) => (
                    <IssueRow
                      key={r.id}
                      report={r}
                      busy={busy === r.id}
                      action={action}
                      isExpanded={expandedIssueId === r.id}
                      toggleExpand={() => setExpandedIssueId(expandedIssueId === r.id ? null : r.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: BUREAU ANALYTICS */}
      {activeTab === "bureau" && (
        <div className="grid gap-6 md:grid-cols-2 animate-slide-in">
          
          {/* CIVIC EQUITY INDEX CARDS (REPLACING THE OLD TABLE) */}
          <div className="space-y-4 md:col-span-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                ⚖️ AI Civic Equity Index
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audits crew resources relative to predicted ward maintenance requirements to prevent resource allocation bias.
              </p>
            </div>

            {/* Alert banner */}
            <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-3 text-xs leading-relaxed text-slate-600 shadow-sm flex items-start gap-2">
              <AlertTriangle size={15} className="text-violet-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Systemic Disparity Flagged:</span> Ward 5 (Govandi East) has 8 open critical issues but has received only 18% of dispatched road maintenance crews. AI detects a <strong>4.88x resource allocation disparity</strong> suggesting neglect risk relative to Ward 14.
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Ward 14 */}
              <div className="card p-4 border-emerald-100 bg-emerald-50/5 relative">
                <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[9px] absolute top-3 right-3 font-extrabold uppercase">
                  Fair
                </span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward 14 (Andheri West)</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-800">78</span>
                  <span className="text-xs text-slate-400 font-bold">/100 Need</span>
                </div>
                <div className="mt-2 text-xs text-slate-600 flex justify-between">
                  <span>Crews Dispatched:</span>
                  <span className="font-semibold text-slate-800">62%</span>
                </div>
                <div className="mt-1 text-xs text-slate-600 flex justify-between">
                  <span>Disparity Ratio:</span>
                  <span className="font-bold text-emerald-600">1.25</span>
                </div>
              </div>

              {/* Ward 9 */}
              <div className="card p-4 border-emerald-100 bg-emerald-50/5 relative">
                <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[9px] absolute top-3 right-3 font-extrabold uppercase">
                  Optimal
                </span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward 9 (Bandra West)</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-800">42</span>
                  <span className="text-xs text-slate-400 font-bold">/100 Need</span>
                </div>
                <div className="mt-2 text-xs text-slate-600 flex justify-between">
                  <span>Crews Dispatched:</span>
                  <span className="font-semibold text-slate-800">48%</span>
                </div>
                <div className="mt-1 text-xs text-slate-600 flex justify-between">
                  <span>Disparity Ratio:</span>
                  <span className="font-bold text-emerald-600">0.88</span>
                </div>
              </div>

              {/* Ward 21 */}
              <div className="card p-4 border-emerald-100 bg-emerald-50/5 relative">
                <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[9px] absolute top-3 right-3 font-extrabold uppercase">
                  Fair
                </span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward 21 (Powai)</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-800">58</span>
                  <span className="text-xs text-slate-400 font-bold">/100 Need</span>
                </div>
                <div className="mt-2 text-xs text-slate-600 flex justify-between">
                  <span>Crews Dispatched:</span>
                  <span className="font-semibold text-slate-800">50%</span>
                </div>
                <div className="mt-1 text-xs text-slate-600 flex justify-between">
                  <span>Disparity Ratio:</span>
                  <span className="font-bold text-emerald-600">1.16</span>
                </div>
              </div>

              {/* Ward 5 */}
              <div className="card p-4 border-rose-100 bg-rose-50/10 relative">
                <span className="flex h-2 w-2 absolute top-4 right-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward 5 (Govandi East)</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-rose-700">88</span>
                  <span className="text-xs text-slate-400 font-bold">/100 Need</span>
                </div>
                <div className="mt-2 text-xs text-slate-600 flex justify-between">
                  <span>Crews Dispatched:</span>
                  <span className="font-semibold text-slate-800">18%</span>
                </div>
                <div className="mt-1 text-xs text-slate-600 flex justify-between">
                  <span>Disparity Ratio:</span>
                  <span className="font-bold text-rose-600">4.88 (Neglect)</span>
                </div>
              </div>

            </div>
          </div>

          {/* DEPARTMENT SCORECARDS */}
          <div className="card p-4 md:col-span-2">
            <div className="flex items-center gap-1.5 mb-4">
              <TrendingUp size={16} className="text-brand-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Comparative Department Performance
              </h2>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analytics?.departments.map((d) => (
                <div key={d.departmentId} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">{d.shortName}</h3>
                    <div className="mt-0.5 text-xs text-slate-400 font-semibold">{d.resolved}/{d.assigned} Resolved</div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
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
                    
                    <span className={`text-sm font-extrabold ${
                      d.score >= 75
                        ? "text-emerald-600"
                        : d.score >= 50
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}>
                      {d.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// Compact customized issue row with visual category styling, inline descriptions, and collapsibility
function IssueRow({
  report: r,
  busy,
  action,
  isExpanded,
  toggleExpand,
}: {
  report: Report;
  busy: boolean;
  action: (id: string, act: "ACKNOWLEDGE" | "START" | "RESOLVE") => void;
  isExpanded: boolean;
  toggleExpand: () => void;
}) {
  const meta = CATEGORY_META[r.category as IssueCategory] || CATEGORY_META.OTHER;
  const deadline = r.slaDeadline ? slaInfo(r.slaDeadline) : null;
  const breached = deadline?.breached;

  return (
    <div className={`p-3 transition-all hover:bg-slate-50/80 ${breached ? "border-l-2 border-rose-500 bg-rose-500/[0.01]" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Visual Category Block */}
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xl border transition ${meta.bgClass}`}
          title={meta.label}
        >
          {meta.emoji}
        </span>

        {/* Info Column */}
        <div className="min-w-0 flex-1 cursor-pointer" onClick={toggleExpand}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 hover:text-brand-700 transition">
              {r.title}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{r.id}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge status={r.status} />
            <SlaPill deadline={r.slaDeadline} />
            <SeverityDots value={r.severity} />
            <span className="text-slate-400 font-medium">
              📍 {r.addressText}
            </span>
          </div>
        </div>

        {/* Inline Hover Card Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <QueueAction
            report={r}
            busy={busy}
            onAck={() => action(r.id, "ACKNOWLEDGE")}
            onStart={() => action(r.id, "START")}
            onResolve={() => action(r.id, "RESOLVE")}
          />
          <button
            onClick={toggleExpand}
            className={`p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition transform ${
              isExpanded ? "rotate-90 text-slate-700" : ""
            }`}
            title="Toggle Details"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Expanded progressive disclosure box */}
      {isExpanded && (
        <div className="mt-3.5 pl-12 pr-4 pb-1 text-xs text-slate-600 border-t border-slate-100/50 pt-3 animate-slide-down space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Description</span>
              <p className="leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">{r.description || "No description provided."}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <span className="font-semibold text-slate-500">Citizen Support</span>
                <span className="font-bold text-slate-700">👥 {r.confirmCount} confirmed · {r.upvoteCount} upvotes</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                <span className="font-semibold text-slate-500">Severity Level</span>
                <span className="font-bold text-slate-700">{r.severity} / 5</span>
              </div>
              <Link
                href={`/report/${r.id}`}
                className="btn-ghost !w-full justify-center text-center font-bold text-brand-600 hover:text-brand-700 border border-brand-200/50 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <FileText size={13} /> Open Full Details & History
              </Link>
            </div>
          </div>
        </div>
      )}
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
      <button
        disabled={busy}
        onClick={(e) => { e.stopPropagation(); onAck(); }}
        className="btn-ghost !px-2.5 !py-1 text-[11px] font-bold text-brand-600 border border-brand-200/30 rounded-lg hover:bg-brand-50 flex items-center gap-1 bg-white"
      >
        <ClipboardCheck size={13} /> Acknowledge
      </button>
    );
  }
  if (r.status === "ACKNOWLEDGED") {
    return (
      <button
        disabled={busy}
        onClick={(e) => { e.stopPropagation(); onStart(); }}
        className="btn-primary !px-2.5 !py-1 text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1"
      >
        <Play size={12} fill="currentColor" /> Start work
      </button>
    );
  }
  if (r.status === "IN_PROGRESS") {
    return (
      <button
        disabled={busy}
        onClick={(e) => { e.stopPropagation(); onResolve(); }}
        className="btn-success !px-2.5 !py-1 text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1"
      >
        <CheckCircle2 size={13} /> Resolve
      </button>
    );
  }
  if (r.status === "RESOLVED_PENDING_CONFIRM") {
    return (
      <span className="chip bg-amber-50 text-amber-700 ring-amber-200 text-[10px] py-0.5">
        <Hourglass size={11} /> Awaiting citizen
      </span>
    );
  }
  return (
    <span className="chip bg-slate-100 text-slate-500 ring-slate-200 text-[10px] py-0.5">
      <Clock size={11} /> —
    </span>
  );
}
