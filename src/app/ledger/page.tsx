"use client";

import { useState } from "react";
import { Globe, TrendingUp, TrendingDown, Clock, Brain, AlertCircle } from "lucide-react";
import { usePolling } from "@/lib/client";
import { Stat } from "@/components/ui";
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

  const { data: activePrediction } = usePolling<PredictionData>(
    `/api/analytics/predictive-forecast?wardId=${selectedWardId}`,
    5000
  );

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto px-1 py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight font-serif-header text-slate-800">
            <Globe className="text-brand-500" size={22} /> The Public Ledger
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            🌐 India → Maharashtra → <span className="font-semibold">Mumbai Municipal Corporation</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-brand-700">
            {data ? `${data.totals.resolutionRate}%` : "—"}
          </div>
          <div className="text-xs text-slate-500">city-wide resolution rate</div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Issues reported" value={data?.totals.reported ?? "—"} />
        <Stat label="Resolved & verified" value={data?.totals.resolved ?? "—"} accent="green" />
        <Stat label="Active" value={data?.totals.active ?? "—"} accent="amber" />
        <Stat
          label="Avg resolution"
          value={data?.totals.avgResolutionHours ? `${data.totals.avgResolutionHours}h` : "—"}
          accent="blue"
        />
      </div>

      {/* AI Predictive Insights Card */}
      <div className="card p-4 border-violet-100 bg-gradient-to-br from-white to-violet-50/10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-serif-header">
              <Brain className="text-brand-500 animate-pulse" size={17} /> Predictive Risk Projections
            </h2>
            <p className="text-xs text-slate-500">Forecasted infrastructure failure risks & preventative recommendations</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="ward-select" className="text-xs text-slate-500 font-semibold">Select Ward:</label>
            <select
              id="ward-select"
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="text-xs font-bold rounded-lg border border-slate-200 px-2 py-1 bg-white outline-none focus:border-brand-500"
            >
              {data?.wards.map((w) => (
                <option key={w.wardId} value={w.wardId}>
                  {w.name.replace("Ward ", "Ward ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!activePrediction ? (
          <div className="h-48 grid place-items-center text-slate-400 text-xs py-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <span className="font-semibold text-slate-500">Intelligent predictive engine compiling risk models...</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-start">
            {/* Left Column: Risk Gauge & Chart */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`chip ring-1 font-bold ${
                  activePrediction.tone === "red"
                    ? "bg-rose-50 text-rose-700 ring-rose-200"
                    : activePrediction.tone === "green"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}>
                  Risk Level: {activePrediction.level} ({activePrediction.riskScore}/100)
                </span>
                <span className="text-xs text-slate-400">Projected 30-Day Failure Probability Curve</span>
              </div>
              
              {/* Custom SVG Line Chart */}
              <div className="h-40 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-2 flex items-center justify-center">
                <PredictionChart points={activePrediction.points} tone={activePrediction.tone} />
              </div>
            </div>

            {/* Right Column: AI Insights list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Agent Projections</h3>
              <div className="space-y-2">
                {activePrediction.insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <AlertCircle size={14} className={`shrink-0 mt-0.5 ${
                      activePrediction.tone === "red"
                        ? "text-rose-500"
                        : activePrediction.tone === "green"
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`} />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top / bottom wards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <RankCard
          title="Top performing"
          icon={<TrendingUp size={16} className="text-emerald-600" />}
          wards={data?.topPerforming ?? []}
          tone="up"
        />
        <RankCard
          title="Needs attention"
          icon={<TrendingDown size={16} className="text-rose-600" />}
          wards={data?.needsAttention ?? []}
          tone="down"
        />
      </div>

      {/* Ward resolution map */}
      <div className="card p-4">
        <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Neighborhood Resolution Audits
        </h2>
        <div className="space-y-3">
          {data?.wards.map((w) => (
            <div key={w.wardId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{w.name}</span>
                <span className="text-xs text-slate-500">
                  {w.resolved}/{w.reported} resolved · {w.open} open
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${rateColor(w.resolutionRate)}`}
                    style={{ width: `${Math.max(4, w.resolutionRate)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-bold text-slate-700">
                  {w.resolutionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown + department times */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Category Distribution
          </h2>
          <div className="space-y-2">
            {data?.categories.map((c) => {
              const max = data.categories[0]?.count || 1;
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-sm text-slate-600">
                    {c.emoji} {c.label}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(c.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-bold text-slate-700">
                    {c.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Department Accountability Grades
          </h2>
          <div className="space-y-2">
            {data?.departments.map((d) => (
              <div
                key={d.departmentId}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-700">
                    {d.shortName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{d.resolved}/{d.assigned} resolved</span>
                    {d.avgResolutionHours != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {d.avgResolutionHours}h avg
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white ${
                    d.score >= 75
                      ? "bg-emerald-500"
                      : d.score >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                >
                  {d.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Every authority is publicly graded. Every citizen can see exactly where
        their tax money is — or isn&apos;t — working.
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
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        {icon} {title}
      </h2>
      <ol className="space-y-1.5">
        {wards.map((w, i) => (
          <li key={w.wardId} className="flex items-center justify-between text-sm">
            <span className="truncate text-slate-600">
              {i + 1}. {w.name.replace(/^Ward \d+ · /, "")}
            </span>
            <span
              className={`font-bold ${
                tone === "up" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {w.resolutionRate}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Renders a clean, lightweight SVG line chart for predictive curves
function PredictionChart({ points, tone }: { points: number[]; tone: "red" | "amber" | "green" }) {
  const chartHeight = 120;
  const chartWidth = 320;
  const strokeColor = tone === "red" ? "#ef4444" : tone === "amber" ? "#f59e0b" : "#10b981";
  const gradId = `chart-grad-${tone}`;

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (chartWidth - 20) + 10;
    // Map p (0-100) to height (110 to 10)
    const y = chartHeight - 10 - (p / 100) * (chartHeight - 20);
    return { x, y };
  });

  const pathData = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
  const areaData = pathData + ` L ${coords[coords.length - 1].x} ${chartHeight - 5} L ${coords[0].x} ${chartHeight - 5} Z`;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible select-none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="10" y1="20" x2={chartWidth - 10} y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
      <line x1="10" y1="60" x2={chartWidth - 10} y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
      <line x1="10" y1="100" x2={chartWidth - 10} y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />

      {/* Shaded Area */}
      <path d={areaData} fill={`url(#${gradId})`} />

      {/* Line Path */}
      <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3,3" />

      {/* Points */}
      {coords.map((c, idx) => (
        <circle
          key={idx}
          cx={c.x}
          cy={c.y}
          r={idx === coords.length - 1 || idx === Math.floor(coords.length / 2) ? 4.5 : 2}
          fill={strokeColor}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      ))}

      {/* Horizontal Axis */}
      <line x1="10" y1={chartHeight - 5} x2={chartWidth - 10} y2={chartHeight - 5} stroke="#cbd5e1" strokeWidth="1" />

      {/* Chart Labels */}
      <text x="10" y={chartHeight - 15} className="text-[8px] fill-slate-400 font-bold font-mono">Today</text>
      <text x={chartWidth / 2} y={chartHeight - 15} textAnchor="middle" className="text-[8px] fill-slate-400 font-bold font-mono">15d</text>
      <text x={chartWidth - 30} y={chartHeight - 15} className="text-[8px] fill-slate-400 font-bold font-mono">30d Forecast</text>
    </svg>
  );
}
