"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  Activity,
  ShieldAlert,
  ArrowRight,
  Zap,
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  Search,
  Eye,
  Info,
  Clock
} from "lucide-react";
import { usePolling } from "@/lib/client";
import { CATEGORY_META, type Report, type IssueCategory } from "@/lib/types";

interface AgentDecisionLog {
  id: string;
  reportId: string;
  reportTitle: string;
  type: string;
  actorType: string;
  actorName: string | null;
  label: string;
  at: Date;
  category: string;
  severity: number;
  aiConfidence: number;
  tags: string[];
}

export default function AgentControlCenter() {
  const { data: reportData, refresh } = usePolling<{ reports: Report[] }>("/api/reports", 2000);
  const reports = reportData?.reports ?? [];
  const [busy, setBusy] = useState(false);
  const [watchdogResult, setWatchdogResult] = useState<{ escalated: number; processed: number } | null>(null);
  
  // Interactive filters
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [tickerMessage, setTickerMessage] = useState("Agent 01 idling... Ready for ingest");

  const runWatchdog = async () => {
    setBusy(true);
    setWatchdogResult(null);
    try {
      const res = await fetch("/api/agents/sla-watchdog", { method: "POST" });
      const json = await res.json();
      setWatchdogResult({
        processed: json.processed || 0,
        escalated: json.escalated || 0
      });
      refresh();
      setTimeout(() => {
        setWatchdogResult(null);
      }, 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  // Simulating the pulsing Agent Ticker messages
  useEffect(() => {
    const messages = [
      "Agent 01 (Intake) scanning metadata for incoming visual uploads...",
      "Agent 02 (Routing) recalculating SLA deadlines for active PWD issues...",
      "Agent 03 (Audit) reviewing department queue latency for Ward 14...",
      "Agent 01 (Intake) executing visual model duplicate check in area...",
      "Agent 02 (Routing) evaluating consensus threshold for newly verified pothole...",
      "Agent 03 (Audit) auditing resource parity indexes across Andheri West..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setTickerMessage(messages[idx]);
      idx = (idx + 1) % messages.length;
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Extract and format SYSTEM agent decisions
  const agentLogs: AgentDecisionLog[] = reports
    .flatMap((r) =>
      r.events
        .filter((e) => e.actorType === "SYSTEM")
        .map((e) => {
          let tags = ["civic_issue", "municipal"];
          if (r.category) tags.push(r.category.toLowerCase());
          if (r.severity >= 4) tags.push("high_severity");
          
          return {
            id: e.id,
            type: e.type,
            actorType: e.actorType,
            actorName: e.actorName || null,
            label: e.label,
            reportId: r.id,
            reportTitle: r.title,
            at: new Date(e.at),
            category: r.category,
            severity: r.severity,
            aiConfidence: r.aiConfidence || 0.86,
            tags
          };
        })
    )
    .sort((a, b) => +b.at - +a.at);

  // Apply filters based on clicked Agent Topology nodes
  const filteredLogs = agentLogs.filter((log) => {
    if (!selectedAgentFilter) return true;
    if (selectedAgentFilter === "intake") {
      return log.type === "REPORTED" || log.label.includes("Intake") || log.label.includes("classified");
    }
    if (selectedAgentFilter === "verification") {
      return log.type === "VERIFIED" || log.label.includes("consensus") || log.label.includes("merge");
    }
    if (selectedAgentFilter === "routing") {
      return log.type === "ROUTED" || log.label.includes("routed") || log.label.includes("Routing");
    }
    if (selectedAgentFilter === "audit") {
      return log.type === "ESCALATED" || log.label.includes("escalat") || log.label.includes("Watchdog");
    }
    return true;
  });

  const activeReports = reports.filter((r) => r.status !== "CLOSED_VERIFIED" && r.status !== "REJECTED").length;
  const escalatedReports = reports.filter((r) => r.status === "ESCALATED").length;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto px-4 py-6">
      
      {/* Dynamic Keyframes block for moving connections */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-line {
          stroke-dasharray: 6, 6;
          animation: flow 1.2s linear infinite;
        }
      `}} />

      {/* Ambient AI Banner Header */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 border border-brand-100 text-brand-700">
            <Cpu className="text-brand-600 animate-pulse" size={20} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-slate-800 flex items-center gap-2">
              AI Agent Control Center
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Monitor autonomous intake, routing, and escalation audit pipelines
            </p>
          </div>
        </div>

        <div className="bg-slate-50/50 rounded-xl px-4 py-2.5 border border-slate-100/50 text-xs text-slate-600 max-w-xl">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
            <Server size={13} className="text-emerald-500" />
            Agent Engine Health
          </span>
          <p>
            AI handled <strong className="text-brand-700">91.6% of issues autonomously</strong> today. <strong>{escalatedReports} tickets</strong> escalated to Commissioner level due to department SLA breach detections.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {watchdogResult && (
            <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in font-bold">
              Watchdog analyzed {watchdogResult.processed} issues, escalated {watchdogResult.escalated} breach!
            </span>
          )}
          <button
            onClick={runWatchdog}
            disabled={busy}
            className={`btn-primary !px-3 !py-2 text-xs flex items-center gap-1.5 shadow-md ${
              busy ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            <Activity className={busy ? "animate-spin" : ""} size={13} />
            {busy ? "Watchdog Auditing..." : "Run SLA Watchdog"}
          </button>
          <span className="chip bg-brand-50 text-brand-700 ring-brand-200 flex items-center gap-1 font-bold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* TOPOLOGY: INTERACTIVE AGENT NETWORK VISUALIZER */}
      <div className="card p-5 bg-gradient-to-b from-slate-50 to-white border-slate-100 relative overflow-hidden">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <Database size={13} className="text-brand-500" /> Interactive Agent Topology
        </h2>

        {/* SVG connection lines with crawling dashes */}
        <div className="relative h-20 w-full hidden md:block">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 80">
            <path d="M 112 40 L 300 40" fill="none" stroke="#cbd5e1" strokeWidth="2.5" className="flow-line" />
            <path d="M 300 40 L 487 40" fill="none" stroke="#cbd5e1" strokeWidth="2.5" className="flow-line" />
            <path d="M 487 40 L 675 40" fill="none" stroke="#cbd5e1" strokeWidth="2.5" className="flow-line" />
            <path d="M 675 40 L 862 40" fill="none" stroke="#cbd5e1" strokeWidth="2.5" className="flow-line" />
          </svg>
        </div>

        {/* Clickable node elements overlay */}
        <div className="relative md:absolute md:inset-0 p-1 flex flex-col md:flex-row items-center justify-between gap-4 md:px-12 md:top-1/2 md:-translate-y-1/2">
          
          <TopologyNode
            id="intake"
            title="Vision & Intake"
            emoji="📷"
            status="Online"
            active={selectedAgentFilter === "intake"}
            onClick={() => setSelectedAgentFilter(selectedAgentFilter === "intake" ? null : "intake")}
          />
          
          <TopologyNode
            id="verification"
            title="Consensus Auditor"
            emoji="🤝"
            status="Vigilant"
            active={selectedAgentFilter === "verification"}
            onClick={() => setSelectedAgentFilter(selectedAgentFilter === "verification" ? null : "verification")}
          />
          
          <TopologyNode
            id="routing"
            title="Routing Dispatcher"
            emoji="⚡"
            status="Monitoring"
            active={selectedAgentFilter === "routing"}
            onClick={() => setSelectedAgentFilter(selectedAgentFilter === "routing" ? null : "routing")}
          />

          <TopologyNode
            id="audit"
            title="SLA Watchdog"
            emoji="🛡️"
            status="Vigilant"
            active={selectedAgentFilter === "audit"}
            onClick={() => setSelectedAgentFilter(selectedAgentFilter === "audit" ? null : "audit")}
          />

        </div>
      </div>

      {/* AGENT MEMORY AND ACCURACY CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        
        {/* Memory Card 1 */}
        <div className="card p-4 bg-gradient-to-br from-white to-brand-50/[0.08] border-brand-100/50">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agent Memory #01</span>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-100 text-[9px] font-bold">Accuracy: 98.4%</span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mt-2">Intake Classifier</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Processed Today</span>
              <strong className="text-slate-800 text-sm">184 issues</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Avg Latency</span>
              <strong className="text-slate-800 text-sm">1.6 seconds</strong>
            </div>
          </div>
        </div>

        {/* Memory Card 2 */}
        <div className="card p-4 bg-gradient-to-br from-white to-amber-50/[0.08] border-amber-100/50">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agent Memory #02</span>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-100 text-[9px] font-bold">Confidence: 96.1%</span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mt-2">Routing Specialist</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Active Queues</span>
              <strong className="text-slate-800 text-sm">4 departments</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Audit Latency</span>
              <strong className="text-slate-800 text-sm">0.8 seconds</strong>
            </div>
          </div>
        </div>

        {/* Memory Card 3 */}
        <div className="card p-4 bg-gradient-to-br from-white to-rose-50/[0.08] border-rose-100/50">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agent Memory #03</span>
            <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-100 text-[9px] font-bold">Resolved Rate: 91.2%</span>
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mt-2">SLA Escalation Watchdog</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Escalated Today</span>
              <strong className="text-slate-800 text-sm">{escalatedReports} tickets</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-semibold text-[10px]">Check Loop</span>
              <strong className="text-slate-800 text-sm">Every 5 mins</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ACTIVITY FEED WITH FILTERING, CONFIDENCE & EXPLAINABILITY DRAWER */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="text-brand-500 animate-pulse" size={14} /> Live Agent Decision Feed
          </h2>
          
          <div className="flex items-center gap-2">
            {selectedAgentFilter && (
              <button
                onClick={() => setSelectedAgentFilter(null)}
                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 underline uppercase"
              >
                Clear Filter
              </button>
            )}
            <span className="text-xs text-slate-400 font-semibold">{filteredLogs.length} events logged</span>
          </div>
        </div>

        {/* Live logs container */}
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No matching autonomous events logged for this filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasLowConfidence = log.aiConfidence < 0.75;
              
              // Decide feed semantic icons
              let icon = <CheckCircle className="text-emerald-500" size={14} />;
              if (log.type === "ESCALATED") {
                icon = <AlertTriangle className="text-rose-500 animate-bounce" size={14} />;
              } else if (log.type === "ROUTED") {
                icon = <Activity className="text-amber-500" size={14} />;
              } else if (log.type === "REPORTED") {
                icon = <Zap className="text-brand-500" size={14} />;
              }

              return (
                <div key={log.id} className="hover:bg-slate-50/50 transition">
                  
                  {/* Primary Log Line */}
                  <div
                    className="p-3.5 text-xs flex gap-3 items-start cursor-pointer select-none"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <span className="shrink-0 mt-0.5">{icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 font-semibold leading-relaxed">
                        {log.label}
                      </div>
                      <div className="mt-1 text-slate-400 flex items-center gap-2 font-medium">
                        <span className="font-mono text-[10px] uppercase text-brand-600">{log.reportId}</span>
                        <span>·</span>
                        <span className="truncate">Target: {log.reportTitle}</span>
                        <span>·</span>
                        <span>{log.at.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Confidence Meter Badge */}
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold ${hasLowConfidence ? "text-rose-600 font-extrabold animate-pulse" : "text-slate-400"}`}>
                        Conf: {Math.round(log.aiConfidence * 100)}%
                      </span>
                      
                      {/* Simple visual progress bar */}
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full ${hasLowConfidence ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${log.aiConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Explainability Drawer */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 bg-slate-50/30 border-t border-slate-100/50 text-xs text-slate-600 space-y-3 animate-slide-down">
                      
                      {/* Low confidence alert banner */}
                      {hasLowConfidence && (
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-start gap-1.5 text-[11px] text-rose-700">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-500" />
                          <span>
                            <strong>Human Intervention Required:</strong> Model output fell below the 75% trust threshold. Auto-routing halted; awaiting Officer Sharma signature.
                          </span>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-3">
                        
                        {/* Box 1: Visual Tags */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                          <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[9px]">Model Visual Tags</span>
                          <div className="flex flex-wrap gap-1">
                            {log.tags.map((t, idx) => (
                              <span key={idx} className="chip bg-slate-50 text-slate-600 ring-slate-100 text-[9px] py-0.5">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Box 2: Node Parameters */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm text-slate-600">
                          <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[9px]">Node Specifications</span>
                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>Severity Index:</span>
                              <span className="font-bold text-slate-800">{log.severity}/5</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Consensus Count:</span>
                              <span className="font-bold text-slate-800">Verified</span>
                            </div>
                          </div>
                        </div>

                        {/* Box 3: LLM Justification */}
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm col-span-1 sm:col-span-1">
                          <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wider text-[9px]">Routing Logic Reason</span>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            Geospatial coordinates mapping algorithm match category `{log.category}` to default department with high priority.
                          </p>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* status ticker */}
        <div className="bg-slate-100/50 px-4 py-2 border-t border-slate-100 text-[10px] font-bold text-slate-500 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="uppercase tracking-wider">Status Ticker:</span>
          <span className="font-medium text-slate-600 truncate">{tickerMessage}</span>
        </div>
      </div>

    </div>
  );
}

function TopologyNode({
  id,
  title,
  emoji,
  status,
  active,
  onClick
}: {
  id: string;
  title: string;
  emoji: string;
  status: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-3 border text-center transition flex flex-col items-center justify-center min-w-[150px] shadow-sm select-none ${
        active
          ? "bg-white border-brand-500 ring-2 ring-brand-100 scale-105"
          : "bg-white/80 hover:bg-white border-slate-100 hover:scale-102"
      }`}
    >
      <span className="text-2xl mb-1">{emoji}</span>
      <h3 className="text-xs font-extrabold text-slate-800 tracking-tight leading-tight">{title}</h3>
      
      <span className="mt-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
        {status}
      </span>
    </div>
  );
}
