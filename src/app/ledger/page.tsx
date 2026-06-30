"use client";

import { useState } from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  Brain,
  AlertCircle,
  TrendingUp as TrendUpIcon,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { usePolling } from "@/lib/client";
import { Stat } from "@/components/ui";
import { CATEGORY_META, type IssueCategory } from "@/lib/types";
import type { AnalyticsSummary, WardStat } from "@/lib/analytics";

function rateColor(rate: number): string {
  if (rate >= 75) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  if (rate >= 30) return "bg-orange-500";
  return "bg-rose-500";
}

interface PredictionData {
  riskScore: number;
  level: "High" | "Moderate" | "Low";
  tone: "red" | "amber" | "green";
  insights: string[];
  points: number[];
}

export default function PublicLedger() {
  const { data } = usePolling<AnalyticsSummary>("/api/analytics", 4000);
  const [selectedWardId, setSelectedWardId] = useState("ward-14");
  const [activeTab, setActiveTab] = useState<"overview" | "audits" | "predictive">("overview");

  const { data: activePrediction } = usePolling<PredictionData>(
    `/api/analytics/predictive-forecast?wardId=${selectedWardId}`,
    5000
  );

  // Dynamic City Health score calculation
  const reportedCount = data?.totals.reported ?? 0;
  const resolvedCount = data?.totals.resolved ?? 0;
  const activeCount = data?.totals.active ?? 0;
  
  // Calculate dynamic health score
  const computedHealthScore = Math.min(
    98,
    Math.max(
      35,
      82 - (activeCount * 1.8) + (resolvedCount * 0.8)
    )
  );

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Ambient AI Banner Header */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 border border-brand-100 text-brand-700">
            <Globe className="text-brand-600" size={20} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-slate-800 flex items-center gap-2">
              The Public Ledger
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              🌐 Mumbai Municipal Corporation · Public Transparency Layer
            </p>
          </div>
        </div>

        <div className="bg-slate-50/50 rounded-xl px-4 py-2.5 border border-slate-100/50 text-xs text-slate-600 max-w-xl">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
            <Sparkles size={13} className="text-brand-600 animate-pulse" />
            Ambient Performance Dispatch
          </span>
          <p>
            Ward performance improved <strong className="text-emerald-600">+6.4% this week</strong>. The <span className="font-bold text-slate-800">Water Board</span> resolved 95% of issues within scheduled SLA deadlines, leading public repair efficiency.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xl font-extrabold text-brand-700">
            {data ? `${data.totals.resolutionRate}%` : "—"}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City-Wide Resolution</div>
        </div>
      </div>

      {/* SUB-NAVIGATION TAB PILLS */}
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
        <div className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/20 max-w-md w-full">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition ${
              activeTab === "overview"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            City Overview
          </button>
          <button
            onClick={() => setActiveTab("audits")}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition ${
              activeTab === "audits"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Neighborhood Audits
          </button>
          <button
            onClick={() => setActiveTab("predictive")}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold tracking-wide transition ${
              activeTab === "predictive"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Predictive Engine
          </button>
        </div>
        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
          Last updated 1m ago
        </span>
      </div>

      {/* TAB CONTENT 1: CITY OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3 animate-slide-in">
          
          {/* LEFT: Dynamic Pulsing City Health Score HUD */}
          <div className="card p-6 bg-gradient-to-b from-slate-50 to-white border-slate-100 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6">
              City Health Index
            </h3>
            
            {/* Visual Pulsing HUD circle */}
            <div className="relative flex items-center justify-center h-36 w-36 mb-6">
              {/* Outer pulsing ring */}
              <div className="absolute h-32 w-32 rounded-full border border-brand-500/20 bg-brand-50/10 animate-pulse" />
              <div className="absolute h-28 w-28 rounded-full border border-brand-400/30 bg-brand-50/20 animate-ping opacity-40" />
              
              {/* Inner HUD circle */}
              <div className="relative h-24 w-24 rounded-full bg-white border-2 border-brand-500 shadow-md flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-800">{Math.round(computedHealthScore)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Health</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                <TrendingUp size={14} /> +4.2 points this month
              </span>
              <p className="mt-2 leading-relaxed px-4">
                Score increases as unresolved tickets decrease and department resolution times fall within SLA bounds.
              </p>
            </div>
          </div>

          {/* RIGHT: Stats with Narrative Descriptions */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat 
                label="Issues Reported" 
                value={reportedCount} 
                sub={<span className="text-[11px] text-slate-400 font-semibold">Total grievances logged</span>} 
              />
              <Stat 
                label="Resolved & Verified" 
                value={resolvedCount} 
                accent="green" 
                sub={<span className="text-[11px] text-emerald-600 font-bold">📈 +12 solved this week</span>} 
              />
              <Stat 
                label="Active Queue" 
                value={activeCount} 
                accent="amber" 
                sub={<span className="text-[11px] text-amber-600 font-semibold">⏳ SLA countdown active</span>} 
              />
              <Stat 
                label="Avg Resolution" 
                value={data?.totals.avgResolutionHours ? `${data.totals.avgResolutionHours}h` : "—"} 
                accent="blue" 
                sub={<span className="text-[11px] text-blue-600 font-bold">⚡ Repair rate: 170h → 112h</span>} 
              />
            </div>

            {/* Department Accountability Cards (Replacing old layout) */}
            <div className="card p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" /> Department Accountability Scorecard
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {data?.departments.map((d) => {
                  const isExcellent = d.score >= 75;
                  const isImproving = d.score >= 50 && d.score < 75;
                  return (
                    <div key={d.departmentId} className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{d.shortName}</h4>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                          <span>{d.resolved}/{d.assigned} resolved</span>
                          {d.avgResolutionHours != null && (
                            <span>· {d.avgResolutionHours}h avg</span>
                          )}
                        </div>
                      </div>
                      
                      <span className={`chip py-1 px-2.5 font-bold text-xs shrink-0 ${
                        isExcellent
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : isImproving
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}>
                        {isExcellent ? "🟢 Excellent" : isImproving ? "🟠 Improving" : "🔴 Attention"} ({d.score}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category Distribution (Visual Memory Color System) */}
          <div className="card p-4 md:col-span-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Category Incident Share & Visual Memory Index
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data?.categories.map((c) => {
                const meta = CATEGORY_META[c.category as IssueCategory] || CATEGORY_META.OTHER;
                return (
                  <div key={c.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg border text-base ${meta.bgClass}`}>
                        {meta.emoji}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{meta.label}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Share: {c.count}</span>
                      </div>
                    </div>
                    
                    {/* Visual Color Dot indicator */}
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-35 ${meta.dotClass}`} />
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${meta.dotClass}`} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: NEIGHBORHOOD AUDITS */}
      {activeTab === "audits" && (
        <div className="space-y-6 animate-slide-in">
          
          {/* Top / bottom performance cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <RankCard
              title="Top Performing Wards"
              icon={<TrendingUp size={16} className="text-emerald-600" />}
              wards={data?.topPerforming ?? []}
              tone="up"
            />
            <RankCard
              title="Needs Attention (Low Resolution Wards)"
              icon={<TrendingDown size={16} className="text-rose-600" />}
              wards={data?.needsAttention ?? []}
              tone="down"
            />
          </div>

          {/* Ward Resolution list cards */}
          <div className="card p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
              Ward-by-Ward Resolution Audits (No Tables)
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data?.wards.map((w) => (
                <div key={w.wardId} className="p-3 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{w.name}</h4>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span>{w.resolved}/{w.reported} Solved</span>
                      <span>{w.open} Open</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${rateColor(w.resolutionRate)}`}
                        style={{ width: `${Math.max(4, w.resolutionRate)}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 w-8 text-right">
                      {w.resolutionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 3: PREDICTIVE ENGINE */}
      {activeTab === "predictive" && (
        <div className="space-y-6 animate-slide-in">
          
          {/* Ward selector */}
          <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Brain size={16} className="text-brand-600" />
              <span>Analyzing Ward:</span>
              <select
                id="ward-select"
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1 bg-white outline-none focus:border-brand-500 cursor-pointer text-slate-800"
              >
                {data?.wards.map((w) => (
                  <option key={w.wardId} value={w.wardId}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            
            {activePrediction && (
              <span className="text-xs text-slate-400 font-semibold hidden md:inline">
                Risk computations compiled autonomously
              </span>
            )}
          </div>

          {/* AI Projections card */}
          <div className="card p-5 border-violet-100 bg-gradient-to-br from-white to-violet-50/10">
            {!activePrediction ? (
              <div className="h-48 grid place-items-center text-slate-400 text-xs py-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  <span className="font-semibold text-slate-500">Intelligent predictive engine compiling risk models...</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3 items-start">
                
                {/* Visual Chart & Indicators */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`chip ring-1 font-bold text-xs ${
                      activePrediction.tone === "red"
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : activePrediction.tone === "green"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}>
                      Risk Level: {activePrediction.level} ({activePrediction.riskScore}/100)
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">Projected 30-Day Failure Probability Curve</span>
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="h-44 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-2 flex items-center justify-center">
                    <PredictionChart points={activePrediction.points} tone={activePrediction.tone} />
                  </div>
                </div>

                {/* AI projections and advice readable in 5 seconds */}
                <div className="space-y-4 self-stretch flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-brand-500" /> AI Recommended Action (5s Read)
                    </h3>
                    
                    <div className="rounded-xl border border-violet-100 bg-white p-3.5 shadow-sm text-xs leading-relaxed text-slate-600 flex items-start gap-2">
                      <AlertCircle size={15} className="text-violet-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800">🤖 Forecast Projections:</strong> Monsoon precipitation is expected in Andheri this weekend. Water logging risk is <strong className="text-rose-600">High</strong>. Recommended action: <strong>Clean main storm drains in Ward 12/14 today.</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Supporting Insights</h3>
                    {activePrediction.insights.slice(0, 2).map((insight, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                        <ChevronRight size={13} className="shrink-0 mt-0.5 text-slate-400" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
        Every authority is publicly graded · CivicPulse Governance Infrastructure
      </p>
    </div>
  );
}

function RankCard({
  title,
  icon,
  wards,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  wards: WardStat[];
  tone: "up" | "down";
}) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
        {icon} {title}
      </h2>
      <div className="grid gap-2">
        {wards.map((w, i) => (
          <div key={w.wardId} className="flex items-center justify-between text-xs p-2 border border-slate-100/70 rounded-lg bg-slate-50/50">
            <span className="font-semibold text-slate-700">
              {i + 1}. {w.name.replace(/^Ward \d+ · /, "")}
            </span>
            <span
              className={`font-extrabold ${
                tone === "up" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {w.resolutionRate}% resolution
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart drawing component
function PredictionChart({ points, tone }: { points: number[]; tone: "red" | "amber" | "green" }) {
  const chartHeight = 120;
  const chartWidth = 320;
  const strokeColor = tone === "red" ? "#ef4444" : tone === "amber" ? "#f59e0b" : "#10b981";
  const gradId = `chart-grad-${tone}`;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (chartWidth - 20) + 10;
    const y = chartHeight - 10 - (p / 100) * (chartHeight - 20);
    return { x, y };
  });

  const pathData = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
  const areaData = pathData + ` L ${coords[coords.length - 1].x} ${chartHeight - 5} L ${coords[0].x} ${chartHeight - 5} Z`;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="10" y1="20" x2={chartWidth - 10} y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3" />
      <line x1="10" y1="60" x2={chartWidth - 10} y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3" />
      <line x1="10" y1="100" x2={chartWidth - 10} y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3" />

      {/* Shaded Area */}
      <path d={areaData} fill={`url(#${gradId})`} />

      {/* Line Path */}
      <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2" strokeDasharray="2,2" />

      {/* Points */}
      {coords.map((c, idx) => (
        <circle
          key={idx}
          cx={c.x}
          cy={c.y}
          r={idx === coords.length - 1 || idx === Math.floor(coords.length / 2) ? 4 : 2}
          fill={strokeColor}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      ))}

      {/* Horizontal Axis */}
      <line x1="10" y1={chartHeight - 5} x2={chartWidth - 10} y2={chartHeight - 5} stroke="#cbd5e1" strokeWidth="1" />

      {/* Labels */}
      <text x="10" y={chartHeight - 12} className="text-[8px] fill-slate-400 font-bold font-mono">Today</text>
      <text x={chartWidth / 2} y={chartHeight - 12} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold font-mono">15d</text>
      <text x={chartWidth - 40} y={chartHeight - 12} className="text-[8px] fill-slate-400 font-bold font-mono">30d Forecast</text>
    </svg>
  );
}
