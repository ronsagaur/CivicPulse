"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Plus, Flame, ShieldCheck, X, ArrowRight, MessageSquare, Send, Sparkles, Trophy, Award, LogOut } from "lucide-react";
import MapView from "@/components/MapView";
import ReportCard from "@/components/ReportCard";
import { Stat, TrustBadge, CategoryChip, SeverityDots } from "@/components/ui";
import { api, usePolling } from "@/lib/client";
import type { AppUser, Report } from "@/lib/types";
import type { AnalyticsSummary } from "@/lib/analytics";

const WARD_CENTER = { lat: 19.1197, lng: 72.8468 };

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

  const fetchMeta = () => {
    api<{ currentUser: AppUser; users: AppUser[] }>("/api/meta").then((m) => {
      setMe(m.currentUser);
      setAllUsers(m.users);
    });
  };

  useEffect(() => {
    fetchMeta();
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
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50 mb-4 bg-slate-100 group">
        <MapView reports={reports} center={me ? me.home : WARD_CENTER} heat={heat} height={400} />
        
        {/* Edge fade gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20 pointer-events-none z-[999]" />

        {/* Hero Overlay Details (HUD) */}
        <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-[1000] pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-[10px] font-extrabold tracking-widest text-white/80 uppercase mb-1">
              Ward 14
            </h2>
            <h1 className="text-3xl font-extrabold tracking-tight font-serif-header text-white drop-shadow-md">
              Andheri West
            </h1>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto">
            {me ? <TrustBadge score={me.trustScore} /> : null}
            <Link href="/authority" className="btn-ghost !bg-white/15 !border-white/10 !text-white hover:!bg-white/25 backdrop-blur-md !px-3 flex items-center gap-1.5 text-xs font-bold shadow-lg" title="Go to Authority Portal">
              <ShieldCheck size={15} /> Authority
            </Link>
            <Link href="/report/new" className="btn-primary !bg-white/95 !text-slate-900 hover:!bg-white shadow-xl backdrop-blur-md">
              <Plus size={16} /> Report an issue
            </Link>
            <button onClick={handleLogout} className="btn-ghost !bg-white/20 !border-white/20 !text-white hover:!bg-white/30 backdrop-blur-md !px-3 shadow-lg" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Left: Health Score Card */}
        <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl pointer-events-auto text-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Citizen Health Score</div>
              <div className="text-3xl font-black text-slate-800 flex items-end gap-1.5 leading-none">
                {analytics?.totals.healthScore ?? "73"}%
                <span className="text-xs font-bold text-emerald-600 mb-0.5">
                  {analytics && analytics.totals.healthScore >= 75 ? "↑" : "→"}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium mt-1">
                {analytics && analytics.totals.healthScore >= 75 ? "Neighborhood is improving" : "Stable ward performance"}
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200 mx-2" />
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold shadow-md z-40">M</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md z-30">A</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-violet-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md z-20">R</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-sky-500 flex items-center justify-center text-[10px] text-white font-bold shadow-md z-10">K</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold shadow-md">
                +42
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right: Map Controls Legend HUD */}
        <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl shadow-2xl pointer-events-auto text-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <Legend color="#ef4444" label="Open" />
              <Legend color="#f59e0b" label="In progress" />
              <Legend color="#10b981" label="Resolved" />
              <Legend color="#e11d48" label="Escalated" />
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={() => setHeat((h) => !h)}
              className={`chip ring-1 ${
                heat
                  ? "bg-orange-50 text-orange-700 ring-orange-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              <Flame size={13} /> Heatmap {heat ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex border-b border-slate-200/80 gap-8 mb-6">
        {[
          { id: "GRIEVANCES", label: "Local Grievances", count: needVerify.length },
          { id: "IMPACT", label: "My Impact", count: null },
          { id: "INTELLIGENCE", label: "Ward Intelligence", count: null }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-4 text-xs font-extrabold uppercase tracking-wider relative transition-all duration-200 -mb-[1.5px] border-b-2 ${
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
