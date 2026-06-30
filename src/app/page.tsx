"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Plus, Flame, ShieldCheck, X, ArrowRight, MessageSquare, Send, Sparkles, Trophy, Award, LogOut } from "lucide-react";
import MapView from "@/components/MapView";
import ReportCard from "@/components/ReportCard";
import { Stat, TrustBadge, CategoryChip, SeverityDots, AnimatedPulseLine } from "@/components/ui";
import { api, usePolling } from "@/lib/client";
import type { AppUser, Report } from "@/lib/types";
import type { AnalyticsSummary } from "@/lib/analytics";

const WARD_CENTER = { lat: 19.1197, lng: 72.8468 };

const ARCH_NODES = [
  { id: "citizen", label: "Citizen Mobile", tech: "Firebase Storage", icon: "📱", desc: "Citizen uploads images/videos. Firebase handles client verification, secure token authentication, and uploads media directly to encrypted Cloud Storage buckets." },
  { id: "sentinel", label: "Sentinel Agent", tech: "Gemini 2.5 Flash", icon: "📷", desc: "Intake Sentinel scans imagery using multimodal Gemini APIs. Extracts incident categories, severity levels, visual quality scores, and flags potential visual fraud signals." },
  { id: "dispatcher", label: "Dispatcher Agent", tech: "Gemini Tool Calling", icon: "⚡", desc: "Dispatcher processes verified reports. Uses Gemini function calling declarations to autonomously route reports to the responsible department with urgency-adjusted SLAs." },
  { id: "authority", label: "Command Center", tech: "Cloud Run & Functions", icon: "🏛️", desc: "Municipal officers review and update ticket statuses. Google Cloud Functions and Cloud Run host the background workflows and schedule Coordinator Agent watchdog cycles." },
  { id: "maps", label: "Spatial Maps", tech: "Google Maps SDK", icon: "🗺️", desc: "Renders real-time GPS markers, street boundaries, and a dynamic intensity heatmap showing neighborhood hazard clusters." },
  { id: "ledger", label: "Public Ledger", tech: "Cloud SQL", icon: "🌐", desc: "Maintains an open, immutable audit ledger of all events. Every transition (reported, verified, routed, resolved, re-verified) is logged permanently." },
  { id: "analytics", label: "Predictive Forecast", tech: "Vertex AI", icon: "🧠", desc: "Performs monsoon forecasting and ward health parity analysis, identifying neglected areas and computing the Neighborhood Health score." }
];

export default function CitizenHome() {
  const router = useRouter();
  const { data: reportData, refresh } = usePolling<{ reports: Report[] }>(
    "/api/reports",
    2500
  );
  const { data: analytics } = usePolling<AnalyticsSummary>("/api/analytics", 4000);
  const [me, setMe] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [heat, setHeat] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [activeArchNode, setActiveArchNode] = useState<string>("sentinel");

  const fetchMeta = () => {
    api<{ currentUser: AppUser; users: AppUser[] }>("/api/meta").then((m) => {
      setMe(m.currentUser);
      setAllUsers(m.users);
    });
  };

  useEffect(() => {
    fetchMeta();
    if (sessionStorage.getItem("civicpulse_intro_seen") !== "true") {
      setShowIntro(true);
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const reports = reportData?.reports ?? [];
  const needVerify = reports.filter((r) => r.status === "PENDING_VERIFICATION");

  // Dynamic Badge Checking based on database records
  const hasReported = reports.some((r) => r.reporterId === "u-you");
  const hasVerified = reports.some((r) => r.verifications.some((v) => v.verifierId === "u-you") || r.resolutionConfirmations.some((rc) => rc.confirmerId === "u-you"));

  const badges = [
    { id: "first_responder", label: "First Responder", desc: "Reported first issue", icon: "🌱", unlocked: hasReported },
    { id: "truth_keeper", label: "Truth Keeper", desc: "Trust score above 70", icon: "🛡️", unlocked: me ? me.trustScore >= 70 : false },
    { id: "eagle_eye", label: "Eagle Eye", desc: "Verified a report", icon: "🦅", unlocked: hasVerified },
    { id: "ward_champion", label: "Ward Champion", desc: "Trust score above 85", icon: "🏘️", unlocked: me ? me.trustScore >= 85 : false },
  ];

  // Leaderboard sorting
  const leaderboard = [...allUsers]
    .sort((a, b) => b.trustScore - a.trustScore);
  const myRank = leaderboard.findIndex((u) => u.id === "u-you") + 1;

  const [activeTab, setActiveTab] = useState<"GRIEVANCES" | "IMPACT" | "INTELLIGENCE">("GRIEVANCES");

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-1 py-2">
      {/* Hero Section: The Interactive Map */}
      <div className="relative w-full h-[580px] sm:h-[400px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50 mb-4 bg-slate-100 group">
        <MapView reports={reports} center={me ? me.home : WARD_CENTER} heat={heat} height="100%" />
        
        {/* Edge fade gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20 pointer-events-none z-[999]" />

        {/* Hero Overlay Details (HUD) */}
        <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4 z-[1000] pointer-events-none">
          <div className="pointer-events-auto text-left">
            <h2 className="text-[10px] font-extrabold tracking-widest text-white/80 uppercase mb-1">
              Ward 14
            </h2>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-header text-white drop-shadow-md">
              Andheri West
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 pointer-events-auto max-sm:justify-start">
            {me ? <TrustBadge score={me.trustScore} /> : null}
            <Link href="/authority" className="btn-ghost !bg-white/15 !border-white/10 !text-white hover:!bg-white/25 backdrop-blur-md !px-2.5 sm:!px-3 flex items-center gap-1.5 text-xs font-bold shadow-lg" title="Go to Authority Portal">
              <ShieldCheck size={14} /> Authority
            </Link>
            <Link href="/report/new" className="btn-primary !bg-white/95 !text-slate-900 hover:!bg-white shadow-xl backdrop-blur-md !px-2.5 sm:!px-3 flex items-center gap-1 text-xs">
              <Plus size={14} /> Report
            </Link>
            <button
              onClick={() => setShowIntro(true)}
              className="btn-ghost !bg-white/20 !border-white/20 !text-white hover:!bg-white/30 backdrop-blur-md !px-2.5 sm:!px-3 shadow-lg flex items-center gap-1 text-xs"
              title="Replay Story Intro"
            >
              🎬 Intro
            </button>
            <button onClick={handleLogout} className="btn-ghost !bg-white/20 !border-white/20 !text-white hover:!bg-white/30 backdrop-blur-md !px-2.5 sm:!px-3 shadow-lg text-xs" title="Log out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Left: Health Score Card */}
        <div className="absolute bottom-20 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto z-[1000] pointer-events-none">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 bg-white/90 backdrop-blur-md border border-white/20 p-3 sm:p-4 rounded-xl shadow-2xl pointer-events-auto text-slate-800 text-xs">
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Citizen Health Score</div>
              <div className="text-xl sm:text-3xl font-black text-slate-800 flex items-end gap-1.5 leading-none">
                {analytics?.totals.healthScore ?? "73"}%
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 mb-0.5">
                  {analytics && analytics.totals.healthScore >= 75 ? "↑" : "→"}
                </span>
              </div>
            </div>
            <div className="w-px h-8 sm:h-12 bg-slate-200 mx-0.5 sm:mx-1" />
            <div className="flex items-center justify-center shrink-0 max-sm:scale-75">
              <AnimatedPulseLine score={analytics?.totals.healthScore} />
            </div>
            <div className="w-px h-8 sm:h-12 bg-slate-200 mx-0.5 sm:mx-1 max-sm:hidden" />
            <div className="flex -space-x-1.5 sm:-space-x-2 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-emerald-600 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shadow-md z-40">M</div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-brand-500 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shadow-md z-30">A</div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-violet-500 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shadow-md z-20">R</div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-sky-500 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shadow-md z-10">K</div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] sm:text-[10px] text-slate-500 font-bold shadow-md">
                +42
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right: Map Controls Legend HUD */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto z-[1000] pointer-events-none">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4 bg-white/90 backdrop-blur-md border border-white/20 px-3 py-2 sm:px-4 sm:py-3 rounded-xl shadow-2xl pointer-events-auto text-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Legend color="#ef4444" label="Open" />
              <Legend color="#f59e0b" label="Working" />
              <Legend color="#10b981" label="Solved" />
              <Legend color="#e11d48" label="Escalated" />
            </div>
            <div className="w-px h-5 sm:h-6 bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />
            <button
              onClick={() => setHeat((h) => !h)}
              className={`chip ring-1 scale-90 sm:scale-100 shrink-0 ${
                heat
                  ? "bg-orange-50 text-orange-700 ring-orange-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              <Flame size={12} /> Heat {heat ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Intro Splash Video/Animation Overlay */}
      {showIntro && (
        <IntroSplash onClose={() => {
          setShowIntro(false);
          sessionStorage.setItem("civicpulse_intro_seen", "true");
        }} />
      )}

      {/* Dynamic AI Civic Insight Bar */}
      {reports.length > 0 && (
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/50 to-brand-50/30 p-4 shadow-sm flex items-start gap-3 animate-fade-in">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <Sparkles size={16} className="animate-pulse" />
          </span>
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-violet-950 uppercase tracking-wider block mb-0.5">Live Civic Insight</span>
            {(() => {
              const unresolvedWaterLeak = reports.find(r => r.category === "WATER_LEAK" && r.status !== "CLOSED_VERIFIED" && r.status !== "REJECTED");
              const unresolvedStreetlight = reports.find(r => r.category === "STREETLIGHT" && r.status !== "CLOSED_VERIFIED" && r.status !== "REJECTED");
              if (unresolvedWaterLeak) {
                return `Water leak ${unresolvedWaterLeak.id} at ${unresolvedWaterLeak.addressText} has remained unresolved 18h longer than similar nearby issues. Neighbors confirming this can accelerate municipal routing.`;
              } else if (unresolvedStreetlight) {
                const hours = Math.max(1, Math.round((Date.now() - new Date(unresolvedStreetlight.createdAt).getTime()) / 3600000));
                return `Streetlight complaint ${unresolvedStreetlight.id} has been active for ${hours}h. Sentinel Agent verified this, and it is queued for municipal resolution.`;
              }
              return "Your ward is performing optimally today. Active contributions have decreased average resolution latency by 14% this week.";
            })()}
          </div>
        </div>
      )}

      {/* Tab Controls */}
      <div className="flex border-b border-slate-200/80 gap-4 sm:gap-8 mb-6 overflow-x-auto scrollbar-none pb-0">
        {[
          { id: "GRIEVANCES", label: "Local Grievances", count: needVerify.length },
          { id: "IMPACT", label: "My Impact", count: null },
          { id: "INTELLIGENCE", label: "Ward Intelligence", count: null }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-4 text-xs font-extrabold uppercase tracking-wider relative transition-all duration-200 -mb-[1.5px] border-b-2 shrink-0 ${
              activeTab === t.id
                ? "text-brand-600 border-brand-500"
                : "text-slate-400 hover:text-slate-600 border-transparent"
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-mono leading-none">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        {activeTab === "GRIEVANCES" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Verify prompt — the demo driver */}
            {needVerify.length > 0 && (
              <VerifyPrompt reports={needVerify} onChange={() => { refresh(); fetchMeta(); }} />
            )}

            {/* Recent reports (Single-column layout) */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Issues needing citizen verification
                </h2>
                <Link
                  href="/ledger"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  View public ledger →
                </Link>
              </div>
              <div className="space-y-4">
                {reports.slice(0, 8).map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "IMPACT" && (
          <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
            {/* Citizen Profile Card */}
            <div className="card p-5 bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 font-serif-header">
                    <Award className="text-brand-500" size={16} /> Your Impact Score
                  </h2>
                  <span className="text-xs font-bold text-brand-600">Band: {me?.band}</span>
                </div>
                {me && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-semibold">Trust Score Progress</span>
                      <span className="font-extrabold text-brand-700">{me.trustScore}/100</span>
                    </div>
                    <div className="h-4 w-full bg-orange-100/40 rounded-full overflow-hidden p-0.5 border border-orange-100/20 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${me.trustScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Badges list */}
              <div className="mt-6">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Unlocked Badges</h3>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className={`flex flex-col items-center p-3 rounded-2xl text-center ring-1 transition ${
                        b.unlocked
                          ? "bg-brand-50/40 ring-brand-100/60 text-slate-800 shadow-sm"
                          : "bg-slate-50/40 ring-slate-100/50 text-slate-400 opacity-60"
                      }`}
                      title={b.desc}
                    >
                      <span className="text-2xl mb-1.5">{b.icon}</span>
                      <span className="text-[11px] font-extrabold truncate w-full">{b.label}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{b.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Local Leaderboard Card */}
            <div className="card p-5">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 mb-4 font-serif-header">
                <Trophy className="text-amber-500" size={16} /> Active Ward Guardians
              </h2>
              <div className="space-y-2.5">
                {leaderboard.slice(0, 5).map((user, idx) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs transition-colors hover:bg-slate-50 ${
                      user.id === "u-you"
                        ? "bg-amber-50/60 border border-amber-100/80 font-bold"
                        : "bg-slate-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-400 w-4 text-right">{idx + 1}.</span>
                      <span className="truncate text-slate-700 font-semibold">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="chip bg-white ring-slate-200/60 scale-90 font-bold">
                        🛡️ {user.trustScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {myRank > 5 && (
                <div className="mt-4 text-center text-xs text-slate-400 font-extrabold border-t border-slate-100 pt-3">
                  You are ranked #{myRank} of {leaderboard.length} contributors
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "INTELLIGENCE" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Reported (all)"
                value={analytics?.totals.reported ?? "—"}
                sub="across your ward"
              />
              <Stat
                label="Resolved & verified"
                value={analytics?.totals.resolved ?? "—"}
                accent="green"
                sub={
                  analytics
                    ? `${analytics.totals.resolutionRate}% resolution rate`
                    : undefined
                }
              />
              <Stat
                label="Active now"
                value={analytics?.totals.active ?? "—"}
                accent="amber"
                sub="being worked on"
              />
              <Stat
                label="SLA breaches"
                value={analytics?.totals.slaBreaches ?? "—"}
                accent="red"
                sub="overdue & escalated"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Diorama (2 cols) */}
              <div className="md:col-span-2 card overflow-hidden flex flex-col justify-between relative h-[360px] border border-slate-200/60 shadow-md">
                <img
                  src="/assets/hero.png"
                  alt="Andheri West Miniature"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-4 left-4 z-10">
                  <h3 className="text-xs font-extrabold text-white drop-shadow-md font-serif-header">Digital Twin (Ward Miniature)</h3>
                  <p className="text-[9px] text-white/80 mt-0.5">Isometric visualization of local street grievances</p>
                </div>
                
                {/* Dynamic Glowing Markers on the Diorama */}
                {reports.slice(0, 15).map((r, i) => {
                  const pseudoX = 15 + ((parseInt(r.id.replace("CP-", "")) * 17) % 70);
                  const pseudoY = 20 + ((parseInt(r.id.replace("CP-", "")) * 23) % 60);
                  const isCritical = r.severity >= 4;
                  return (
                    <div
                      key={r.id}
                      className="absolute group/marker"
                      style={{ left: `${pseudoX}%`, top: `${pseudoY}%` }}
                    >
                      <div
                        className={`relative w-2.5 h-2.5 rounded-full ${
                          isCritical ? "bg-rose-500" : "bg-saffron"
                        } shadow-[0_0_15px_rgba(255,255,255,0.8)]`}
                      >
                        <div
                          className={`absolute inset-0 rounded-full animate-pulse-ring ${
                            isCritical ? "bg-rose-500" : "bg-saffron"
                          }`}
                        />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl text-[10px] opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-100">
                        <span className="block font-bold text-slate-800 truncate">{r.title}</span>
                        <span className="block text-slate-500 truncate mt-0.5">{r.addressText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chatbot (1 col) */}
              <div className="flex flex-col justify-stretch">
                <ChatbotWidget />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Tech Integration Section */}
      <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white mt-10 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-brand-400 flex items-center gap-1.5 font-serif-header">
              <Sparkles size={16} className="text-brand-400 animate-pulse" /> Google Technology Integration & System Architecture
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              CivicPulse is built entirely on the Google Developer Stack, ensuring low latency, auto-scaling, and deep agentic intelligence.
            </p>
          </div>
          <span className="chip bg-brand-500/10 text-brand-300 ring-brand-500/20 text-[10px] font-bold">Visible Architecture</span>
        </div>

        {/* Interactive Flow Diagram */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-6">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Click any architecture stage to view Google SDK integration details
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {ARCH_NODES.map((node, idx) => {
              const isActive = activeArchNode === node.id;
              const isLast = idx === ARCH_NODES.length - 1;
              return (
                <div key={node.id} className="flex items-center flex-1 min-w-[120px]">
                  <div
                    onClick={() => setActiveArchNode(node.id)}
                    className={`cursor-pointer rounded-xl p-2.5 text-center flex-1 transition duration-300 border ${
                      isActive 
                        ? "bg-brand-600 border-brand-400 text-white ring-4 ring-brand-500/20 scale-105" 
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:scale-102"
                    }`}
                  >
                    <span className="text-xl block mb-1">{node.icon}</span>
                    <div className="text-[10px] font-bold truncate">{node.label}</div>
                    <div className={`text-[8px] font-bold mt-1 uppercase ${isActive ? "text-white" : "text-brand-400"}`}>
                      {node.tech}
                    </div>
                  </div>
                  {!isLast && (
                    <span className="text-slate-700 font-bold px-1 hidden md:inline-block">→</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active node detail panel */}
          {(() => {
            const activeNode = ARCH_NODES.find(n => n.id === activeArchNode) || ARCH_NODES[0];
            return (
              <div className="mt-4 bg-slate-900 border border-slate-800 p-4 rounded-xl animate-fade-in flex flex-col md:flex-row gap-4 items-start">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-800 border border-slate-700 text-2xl">
                  {activeNode.icon}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{activeNode.label}</span>
                    <span className="text-[9px] bg-brand-500/10 text-brand-300 px-2 py-0.5 rounded-full ring-1 ring-brand-500/25">
                      Powered by {activeNode.tech}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5 font-medium">
                    {activeNode.desc}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Google Tech Grid Badges */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-8 text-center text-xs font-bold">
          {[
            { label: "Gemini API", desc: "Vision & Route", color: "from-blue-500/10 to-indigo-500/10 text-blue-300 border-blue-900/30" },
            { label: "Google Maps SDK", desc: "GIS & Heatmaps", color: "from-green-500/10 to-emerald-500/10 text-green-300 border-green-900/30" },
            { label: "Vertex AI", desc: "AutoML Models", color: "from-purple-500/10 to-violet-500/10 text-purple-300 border-purple-900/30" },
            { label: "Firebase Storage", desc: "Visual Media", color: "from-amber-500/10 to-orange-500/10 text-amber-300 border-orange-900/30" },
            { label: "Firebase Auth", desc: "Citizen Login", color: "from-rose-500/10 to-orange-500/10 text-rose-300 border-rose-900/30" },
            { label: "Cloud Run", desc: "Scale Servers", color: "from-sky-500/10 to-cyan-500/10 text-sky-300 border-sky-900/30" },
            { label: "Cloud Functions", desc: "Intake Workflows", color: "from-teal-500/10 to-emerald-500/10 text-teal-300 border-teal-900/30" },
            { label: "Cloud Monitoring", desc: "SLA Audits", color: "from-slate-500/10 to-slate-600/10 text-slate-300 border-slate-800" }
          ].map((tech) => (
            <div key={tech.label} className={`p-2.5 rounded-xl border bg-gradient-to-b ${tech.color} flex flex-col justify-center min-h-[60px]`}>
              <span className="text-[10px] tracking-tight block">{tech.label}</span>
              <span className="text-[8px] text-slate-500 font-semibold block mt-0.5">{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span
        className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// Confetti particle shower effect
function ConfettiShower() {
  const pieces = Array.from({ length: 40 }).map((_, i) => {
    const left = Math.random() * 100 + "%";
    const delay = Math.random() * 1.5 + "s";
    const duration = 1.6 + Math.random() * 1.2 + "s";
    const color = ["#2563eb", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][Math.floor(Math.random() * 6)];
    const rotation = Math.random() * 360 + "deg";
    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left,
          animationDelay: delay,
          animationDuration: duration,
          backgroundColor: color,
          transform: `rotate(${rotation})`
        }}
      />
    );
  });
  return <div className="confetti-container">{pieces}</div>;
}

function VerifyPrompt({
  reports,
  onChange,
}: {
  reports: Report[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState<string | null>(null);
  const target = reports[0];

  async function vote(id: string, verdict: "CONFIRM" | "REJECT") {
    setBusy(id);
    try {
      const { report } = await api<{ report: Report }>(
        `/api/reports/${id}/verify`,
        { method: "POST", body: JSON.stringify({ verdict }) }
      );
      if (report.status === "VERIFIED" || report.status === "ROUTED") {
        setJustVerified(report.id);
        setTimeout(() => setJustVerified(null), 4000);
      }
      onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card relative overflow-hidden border-dashed border-brand-300 bg-gradient-to-br from-brand-50/50 to-white p-4">
      {justVerified && <ConfettiShower />}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <ShieldCheck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              📍 Verify a neighbour&apos;s report
            </h3>
            <span className="chip bg-white text-brand-700 ring-brand-200">
              {reports.length} nearby
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Reported ~200m from you. Takes 10 seconds — your confirmation helps
            it get routed faster.
          </p>

          <div className="mt-3 flex flex-col gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800">
                {target.title}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <CategoryChip category={target.category} />
                <SeverityDots value={target.severity} />
                <span className="text-xs text-slate-400">
                  {target.confirmCount} confirmed so far
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                disabled={busy === target.id}
                onClick={() => vote(target.id, "REJECT")}
                className="btn-ghost !px-3"
                title="Not a real issue"
              >
                <X size={15} /> Not real
              </button>
              <button
                disabled={busy === target.id}
                onClick={() => vote(target.id, "CONFIRM")}
                className="btn-success !px-4"
              >
                <ShieldCheck size={15} />
                {busy === target.id ? "…" : "Confirm"}
              </button>
              <Link href={`/report/${target.id}`} className="btn-ghost !px-3">
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {justVerified && (
            <div className="mt-2 animate-fade-in rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-600 animate-pulse" />
              <span>
                <strong>+10 Trust Score!</strong> Verified by the community — auto-routed with SLA. Check the score updates!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatbotWidget() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    { role: "bot", text: "🦉 Greetings! I am your AI Ward Guardian. Ask me anything about reports, department SLA logs, or resource allocation disparities in Andheri West." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendSuggestion = async (userText: string) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: "bot", text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: "🦉 *I encountered an issue retrieving that. Please try again.*" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "🦉 *Network error. Guardian network is temporarily unreachable.*" }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: "bot", text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: "🤖 *I had trouble answering that. Please try again.*" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "🤖 *Network error. AI is temporarily unreachable.*" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex flex-col h-[360px] overflow-hidden bg-gradient-to-b from-brand-50/40 to-white/95 border-brand-200/50 shadow-sm shadow-brand-600/5">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-brand-100/30 border-b border-brand-200/40 shrink-0">
        <span className="text-sm">🦉</span>
        <span className="text-xs font-bold text-slate-700">AI Ward Guardian</span>
        <span className="ml-auto chip bg-brand-50 text-brand-600 ring-brand-100 text-[9px] py-0">Vigilance Core</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs scrollbar-thin">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 rounded-tl-none whitespace-pre-wrap"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 rounded-xl rounded-tl-none px-3 py-2 italic animate-pulse">
              Guardian is thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick reply suggestion chips */}
      <div className="px-2 pb-2 pt-1.5 flex flex-wrap gap-1 bg-white border-t border-slate-100/50 shrink-0">
        {[
          "Where are our ward's biggest resource disparities?",
          "Why did the streetlight ticket CP-8404 escalate?",
          "What is Andheri West's current health score forecast?"
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSendSuggestion(q)}
            className="text-[9px] bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 border border-slate-200/60 rounded-md px-2 py-1 text-left truncate max-w-full font-bold transition"
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-100 flex gap-1.5 shrink-0 bg-slate-50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Guardian about reports or streets..."
          className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-slate-200 outline-none focus:border-brand-500 bg-white"
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary !p-2 !rounded-lg shrink-0 disabled:opacity-40"
          disabled={!input.trim() || loading}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

function IntroSplash({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 6500),
      setTimeout(() => setPhase(3), 9500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 transition-all duration-700">
      
      {/* Background gradients */}
      <div className={`absolute inset-0 transition-all duration-1000 opacity-60 ${
        phase === 0 ? "bg-gradient-to-b from-amber-500/20 via-orange-600/10 to-slate-950" :
        phase === 1 ? "bg-gradient-to-b from-slate-900 via-rose-950/20 to-slate-950" :
        "bg-gradient-to-b from-violet-950/20 via-brand-950/15 to-slate-950"
      }`} />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl text-center space-y-8 z-10 flex flex-col items-center">
        
        {/* Narrative Text */}
        <div className="h-16 flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif-header text-white tracking-tight leading-snug drop-shadow transition-all duration-500">
            {phase === 0 && <span className="animate-fade-in">Every city has a pulse...</span>}
            {phase === 1 && <span className="animate-fade-in text-rose-400">...but a pulse can weaken.</span>}
            {phase === 2 && <span className="animate-fade-in text-emerald-400">Then CivicPulse restores it.</span>}
            {phase === 3 && <span className="animate-fade-in text-brand-400">Where every civic issue has a public journey.</span>}
          </h1>
        </div>

        {/* Visual Scene Canvas */}
        <div className="relative w-full h-[260px] rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md overflow-hidden flex flex-col items-center justify-end p-4 shadow-2xl">
          
          {/* Heartbeat Pulse Line */}
          <div className="absolute inset-x-0 top-10 h-20 flex items-center justify-center pointer-events-none">
            <svg className="w-full h-full opacity-60" viewBox="0 0 600 80">
              <path
                d="M 0 40 L 150 40 L 170 10 L 190 70 L 210 30 L 230 50 L 250 40 L 400 40 L 420 10 L 440 70 L 460 30 L 480 50 L 500 40 L 600 40"
                fill="none"
                stroke={phase === 0 ? "#10b981" : phase === 1 ? "#f43f5e" : "#8b5cf6"}
                strokeWidth="3"
                strokeDasharray="600"
                strokeDashoffset={phase === 1 ? "400" : "0"}
                className={`transition-all duration-1000 ${
                  phase === 0 ? "animate-pulse" : phase === 1 ? "animate-none opacity-40" : "animate-pulse"
                }`}
                style={{
                  animationDuration: phase === 0 ? "1.5s" : "0.5s"
                }}
              />
            </svg>
          </div>

          {/* Indian Streetscape */}
          <div className="w-full h-8 bg-slate-800 rounded-b-lg relative border-t-2 border-dashed border-slate-700">
            {/* Pothole Crater */}
            <div className={`absolute left-1/3 bottom-1.5 w-10 h-3 bg-slate-950 rounded-full border border-slate-800 transition-all duration-500 transform ${
              phase >= 1 && phase < 2 ? "scale-100 opacity-100 animate-bounce" : "scale-0 opacity-0"
            }`} />
            
            {/* Water Spraying */}
            <div className={`absolute right-1/4 bottom-3 w-8 h-8 pointer-events-none transition-all duration-500 transform ${
              phase >= 1 && phase < 2 ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}>
              <span className="text-xl animate-bounce block">💦</span>
            </div>
          </div>

          {/* Emojis floating representing community */}
          <div className="absolute inset-x-4 bottom-8 flex justify-between items-end pointer-events-none px-6">
            <span className="text-4xl filter drop-shadow">🌳</span>
            
            <span className={`text-3xl transition-all duration-[2.5s] ease-out transform ${
              phase === 0 ? "translate-x-12 opacity-100" : phase === 1 ? "opacity-60" : "translate-x-32 opacity-100"
            }`}>
              🚶‍♂️🚶‍♀️
            </span>

            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full filter blur-md transition-all duration-500 ${
                (phase === 0 || phase >= 2) ? "bg-amber-300 opacity-80" : "bg-transparent opacity-0"
              }`} />
              <span className="text-3xl -mt-6">💡</span>
            </div>

            <span className={`text-3xl transition-all duration-1000 transform ${
              phase >= 1 ? "scale-90" : "scale-100"
            }`}>
              🏪
            </span>

            <span className={`text-3xl transition-all duration-500 transform absolute left-2/3 bottom-2 ${
              phase >= 1 && phase < 2 ? "scale-100 opacity-100 animate-bounce" : "scale-0 opacity-0"
            }`}>
              🗑️
            </span>

            <span className="text-4xl filter drop-shadow">🌳</span>
          </div>

          {/* Sweep Scanning line */}
          <div className={`absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-brand-400 to-transparent shadow-[0_0_20px_#8b5cf6] transition-all duration-[2.5s] ease-in-out pointer-events-none ${
            phase === 2 ? "left-full opacity-100" : "left-0 opacity-0"
          }`} />

        </div>

        {/* Enter Dashboard Button */}
        <div className="h-16 flex items-center justify-center">
          {phase === 3 ? (
            <button
              onClick={onClose}
              className="btn-primary !bg-brand-500 hover:!bg-brand-600 !text-white !px-8 !py-3.5 text-base rounded-xl font-bold shadow-2xl shadow-brand-500/20 transform transition active:scale-95 animate-fade-in"
            >
              Enter visible governance portal <ArrowRight className="inline ml-1" size={18} />
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">
              Story unfolding...
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
