"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Plus, Flame, ShieldCheck, X, ArrowRight, MessageSquare, Send, Sparkles, Trophy, Award } from "lucide-react";
import MapView from "@/components/MapView";
import ReportCard from "@/components/ReportCard";
import { Stat, TrustBadge, CategoryChip, SeverityDots } from "@/components/ui";
import { api, usePolling } from "@/lib/client";
import type { AppUser, Report } from "@/lib/types";
import type { AnalyticsSummary } from "@/lib/analytics";

const WARD_CENTER = { lat: 19.1197, lng: 72.8468 };

export default function CitizenHome() {
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

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-1 py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-serif-header text-slate-800">
            Caring for Andheri West
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Ward 14 · Andheri West, Mumbai
          </p>
        </div>
        <div className="flex items-center gap-2">
          {me ? <TrustBadge score={me.trustScore} /> : null}
          <Link href="/report/new" className="btn-primary">
            <Plus size={16} /> Report an issue
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      {/* Dashboard Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Content Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Verify prompt — the demo driver */}
          {needVerify.length > 0 && (
            <VerifyPrompt reports={needVerify} onChange={() => { refresh(); fetchMeta(); }} />
          )}

          {/* Map */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3 text-sm">
                <Legend color="#ef4444" label="Open" />
                <Legend color="#f59e0b" label="In progress" />
                <Legend color="#10b981" label="Resolved" />
                <Legend color="#e11d48" label="Escalated" />
              </div>
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
            <MapView reports={reports} center={WARD_CENTER} heat={heat} height={420} />
          </div>

          {/* Recent reports */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Grievances in your neighborhood
              </h2>
              <Link
                href="/ledger"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                View public ledger →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reports.slice(0, 8).map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets (Right 1 Column) */}
        <div className="space-y-5">
          {/* Citizen Profile Card */}
          <div className="card p-4 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 font-serif-header">
                <Award className="text-brand-500" size={16} /> Your Impact Score
              </h2>
              <span className="text-xs font-semibold text-slate-400">Band: {me?.band}</span>
            </div>
            {me && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Trust Score Progress</span>
                  <span className="font-bold text-brand-700">{me.trustScore}/100</span>
                </div>
                <div className="h-3.5 w-full bg-orange-100/40 rounded-full overflow-hidden p-0.5 border border-orange-100/20 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${me.trustScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* Badges list */}
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unlocked Badges</h3>
              <div className="grid grid-cols-2 gap-2">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`flex flex-col items-center p-2 rounded-xl text-center ring-1 transition ${
                      b.unlocked
                        ? "bg-brand-50/40 ring-brand-100/60 text-slate-800"
                        : "bg-slate-50/40 ring-slate-100/50 text-slate-400 opacity-60"
                    }`}
                    title={b.desc}
                  >
                    <span className="text-xl mb-1">{b.icon}</span>
                    <span className="text-[11px] font-bold truncate w-full">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Local Leaderboard Card */}
          <div className="card p-4">
            <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 mb-3 font-serif-header">
              <Trophy className="text-amber-500" size={16} /> Active Ward Guardians
            </h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((user, idx) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                    user.id === "u-you"
                      ? "bg-amber-50/60 border border-amber-100/80 font-bold"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 w-3 text-right">{idx + 1}.</span>
                    <span className="truncate text-slate-700">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="chip bg-slate-100 ring-slate-200 scale-90">
                      🛡️ {user.trustScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {myRank > 5 && (
              <div className="mt-2 text-center text-xs text-slate-400 font-semibold border-t border-slate-100 pt-2">
                You are ranked #{myRank} of {leaderboard.length} contributors
              </div>
            )}
          </div>

          {/* AI Ward Assistant Chatbot */}
          <ChatbotWidget />
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
    <div className="card relative overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4">
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
    { role: "bot", text: "Hello! I am your AI Ward Assistant. Ask me anything about reports or departments in Andheri West." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    <div className="card flex flex-col h-[340px] overflow-hidden bg-gradient-to-b from-brand-50/40 to-white/95 border-brand-200/50 shadow-sm shadow-brand-600/5">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-brand-100/30 border-b border-brand-200/40 shrink-0">
        <MessageSquare className="text-brand-600" size={16} />
        <span className="text-xs font-bold text-slate-700">AI Ward Assistant</span>
        <span className="ml-auto chip bg-brand-50 text-brand-600 ring-brand-100 text-[9px] py-0">Gemini 2.5</span>
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
              Gemini is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Form Input */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-100 flex gap-1.5 shrink-0 bg-slate-50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about CP-8401 or MG Road..."
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
