"use client";

import { useEffect, useState } from "react";
import { Cpu, Activity, ShieldAlert, ArrowRight, Zap, CheckCircle } from "lucide-react";
import { usePolling } from "@/lib/client";
import type { Report } from "@/lib/types";

export default function AgentControlCenter() {
  const { data: reportData } = usePolling<{ reports: Report[] }>("/api/reports", 2000);
  const reports = reportData?.reports ?? [];

  // Extract all SYSTEM agent decisions from database reports
  const agentLogs = reports
    .flatMap((r) =>
      r.events
        .filter((e) => e.actorType === "SYSTEM")
        .map((e) => ({
          ...e,
          reportId: r.id,
          reportTitle: r.title,
        }))
    )
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const activeReports = reports.filter((r) => r.status !== "CLOSED_VERIFIED" && r.status !== "REJECTED").length;
  const escalatedReports = reports.filter((r) => r.status === "ESCALATED").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Cpu className="text-brand-600" size={24} /> AI Agent Control Center
          </h1>
          <p className="text-sm text-slate-500">
            Monitor the autonomous intake, routing, and escalation loops of Andheri West
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-brand-50 text-brand-700 ring-brand-200 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Agent Network Online
          </span>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Agent 1 */}
        <div className="card p-4 bg-gradient-to-br from-white to-brand-50/20 border-brand-100">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-brand-100 text-brand-700 grid place-items-center font-bold">
              01
            </div>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[10px] scale-90">
              🟢 Monitoring
            </span>
          </div>
          <h2 className="mt-3 text-sm font-bold text-slate-800">Intake & Verification Agent</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Powered by **Gemini 2.5 Flash**. Analyzes visual uploads, checks metadata, flags duplicate claims, and assigns severity.
          </p>
        </div>

        {/* Agent 2 */}
        <div className="card p-4 bg-gradient-to-br from-white to-amber-50/20 border-amber-100">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 grid place-items-center font-bold">
              02
            </div>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[10px] scale-90">
              🟢 Active
            </span>
          </div>
          <h2 className="mt-3 text-sm font-bold text-slate-800">Department Routing Agent</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Monitors consensus thresholds. When neighbors verify an issue, it auto-routes the ticket to PWD, Water, or SWM with an SLA.
          </p>
        </div>

        {/* Agent 3 */}
        <div className="card p-4 bg-gradient-to-br from-white to-rose-50/20 border-rose-100">
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-700 grid place-items-center font-bold">
              03
            </div>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200 text-[10px] scale-90">
              🟢 Vigilant
            </span>
          </div>
          <h2 className="mt-3 text-sm font-bold text-slate-800">Escalation & Audit Agent</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Tracks SLA timers. Triggers community re-verification checks. If a fix fails verification, it escalates to Commissioner.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Loop */}
      <div className="card p-4">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Autonomous Lifecycle Loop</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 px-6">
          <PipelineStep icon={<Zap className="text-brand-600" size={16} />} title="Intake" desc="Gemini Classification" />
          <ArrowRight className="hidden md:block text-slate-300" size={16} />
          <PipelineStep icon={<CheckCircle className="text-emerald-600" size={16} />} title="Verification" desc="Consensus Gate" />
          <ArrowRight className="hidden md:block text-slate-300" size={16} />
          <PipelineStep icon={<Activity className="text-amber-500" size={16} />} title="Routing" desc="SLA Dept Assignment" />
          <ArrowRight className="hidden md:block text-slate-300" size={16} />
          <PipelineStep icon={<ShieldAlert className="text-rose-600" size={16} />} title="Audit Loop" desc="Citizen Confirmation" />
        </div>
      </div>

      {/* Activity Logs (RAG/Database-driven) */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Activity className="text-emerald-500" size={15} /> Live Agent Decision Feed
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{agentLogs.length} autonomous operations logged</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto scrollbar-thin">
          {agentLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No autonomous decisions logged yet. Submit or verify a report to wake the agents!
            </div>
          )}
          {agentLogs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-slate-50 transition text-xs flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold tracking-wide scale-90">
                {log.reportId}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-slate-800 font-medium">
                  {log.label}
                </div>
                <div className="mt-1 text-slate-400 flex items-center gap-2">
                  <span>Target: {log.reportTitle}</span>
                  <span>·</span>
                  <span>{new Date(log.at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto p-3 rounded-xl bg-slate-50 border border-slate-100 md:min-w-[140px]">
      <span className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-extrabold text-slate-800 leading-tight">{title}</div>
        <div className="text-[10px] text-slate-400 truncate">{desc}</div>
      </div>
    </div>
  );
}
