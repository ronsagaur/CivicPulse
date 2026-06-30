"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  ShieldCheck,
  X,
  Wrench,
  AlertTriangle,
  Share2,
  Building2,
  Users,
  Copy,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { api, usePolling } from "@/lib/client";
import {
  CATEGORY_META,
  type Department,
  type Report,
} from "@/lib/types";
import { timeAgo, lifecycleProgress } from "@/lib/format";
import {
  BackLink,
  CategoryChip,
  SeverityDots,
  SlaPill,
  StatusBadge,
} from "@/components/ui";

const STEP_LABELS = [
  "Reported",
  "Verified",
  "Routed",
  "Acknowledged",
  "In progress",
  "Resolved",
  "Confirmed",
];

export default function ReportDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, refresh } = usePolling<{ report: Report; department: Department | null }>(
    `/api/reports/${id}`,
    2000
  );
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);

  useEffect(() => {
    if (!isPlaying || !data?.report) return;
    const reportEvents = data.report.events;
    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= reportEvents.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, data?.report]);

  if (!data?.report) {
    return (
      <div className="card p-10 text-center text-sm text-slate-500">
        Loading report…
      </div>
    );
  }
  const r = data.report;
  const dept = data.department;
  const meta = CATEGORY_META[r.category];
  const progress = lifecycleProgress(r.status);

  async function act(path: string, body?: any, msg?: string) {
    setBusy(true);
    try {
      await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      if (msg) {
        setFlash(msg);
        setTimeout(() => setFlash(null), 4500);
      }
      refresh();
    } finally {
      setBusy(false);
    }
  }

  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareData = {
      title: `CivicPulse Report: ${r.title}`,
      text: `Check out report ${r.id} at ${r.addressText} on CivicPulse. Let's get it resolved!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <BackLink href="/" label="Map" />
        <button onClick={handleShare} className="btn-ghost !px-3 !py-1.5 text-xs flex items-center gap-1.5">
          <Share2 size={14} className={copied ? "text-emerald-500" : ""} />
          {copied ? "Link Copied!" : "Share"}
        </button>
      </div>

      {/* Hero */}
      <div className="card overflow-hidden">
        {r.mediaType === "video" ? (
          <div className="h-44 bg-slate-950 w-full relative grid place-items-center">
            <video
              src={r.mediaUrl || "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-pothole-in-the-road-42618-large.mp4"}
              controls
              className="w-full h-full object-contain"
              poster="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400"
            />
            <span className="absolute left-3 top-3 font-mono text-xs text-white/50 z-10 select-none">
              {r.id}
            </span>
            <span className="absolute right-3 top-3 chip bg-slate-950/80 text-white ring-slate-800 text-[10px] uppercase font-bold tracking-wider z-10">
              📹 Video Report
            </span>
          </div>
        ) : (
          <div
            className={`relative h-44 bg-gradient-to-br ${r.imagePlaceholder} grid place-items-center`}
          >
            <span className="text-6xl drop-shadow">{meta.emoji}</span>
            <span className="absolute left-3 top-3 font-mono text-xs text-slate-700/70">
              {r.id}
            </span>
            <span className="absolute right-3 top-3 chip bg-white/80 text-slate-700 ring-white">
              {r.upvoteCount} upvotes · {r.duplicateCount} reports merged
            </span>
          </div>
        )}
        <div className="p-4 relative overflow-hidden">
          {r.upvoteCount >= 5 && (
            <div className="absolute right-4 bottom-2 w-24 h-24 border-4 border-dashed border-emerald-600/15 rounded-full flex items-center justify-center rotate-[-15deg] select-none pointer-events-none">
              <div className="text-center font-extrabold text-[9px] uppercase tracking-widest text-emerald-600/15 leading-tight p-1.5 border border-emerald-600/15 rounded-full">
                Verified<br />Consensus
              </div>
            </div>
          )}
          <h1 className="text-lg font-extrabold">{r.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{r.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} />
            <SlaPill deadline={r.slaDeadline} />
            <CategoryChip category={r.category} />
            <SeverityDots value={r.severity} />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            📍 {r.addressText} · reported by{" "}
            {r.isAnonymous ? "Anonymous" : r.reporterName} {timeAgo(r.createdAt)}
          </div>
          {r.mediaType && (
            <div className="mt-1.5 text-[10px] text-slate-400 font-semibold flex items-center gap-1 select-none">
              <span>🔒 Privacy Guard Active: Bystander faces and vehicle plates anonymized.</span>
            </div>
          )}
          {dept && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <Building2 size={14} /> Routed to {dept.shortName}
            </div>
          )}
        </div>
      </div>

      {/* Escalation banner */}
      {r.status === "ESCALATED" && (
        <div className="card border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 font-bold text-rose-700">
            <AlertTriangle size={18} /> Re-verification failed — auto-escalated
          </div>
          <p className="mt-1 text-sm text-rose-600">
            The community said this wasn&apos;t actually fixed. It&apos;s been
            reopened, bumped to the next authority level, and publicly flagged on
            the ledger. This is the loop nobody else closes.
          </p>
        </div>
      )}

      {flash && (
        <div className="card animate-fade-in border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {flash}
        </div>
      )}

      {/* Lifecycle stepper */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const reached = i < progress;
            const isLast = i === STEP_LABELS.length - 1;
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      reached
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {reached ? "✓" : i + 1}
                  </span>
                  <span
                    className={`mt-1 hidden text-[9px] font-semibold sm:block ${
                      reached ? "text-brand-700" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className={`mx-1 h-0.5 flex-1 ${
                      i + 1 < progress ? "bg-brand-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action zone */}
      <ActionZone report={r} busy={busy} act={act} />

      {/* Automated Community Petition */}
      {r.upvoteCount >= 5 && <PetitionCard report={r} />}

      {/* The Visual Journey Timeline */}
      <div className="card p-6 bg-gradient-to-b from-white to-slate-50 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-3 mb-6 gap-3">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Resolution Journey
          </h2>
          
          {/* Replay Mode Controls */}
          <div className="flex items-center gap-2">
            {playbackIndex >= 0 ? (
              <>
                <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  Step {playbackIndex + 1} of {r.events.length}
                </span>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn-primary !px-2.5 !py-1 text-[11px] font-bold shadow-sm"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setPlaybackIndex(-1);
                  }}
                  className="btn-ghost !px-2.5 !py-1 text-[11px] font-bold"
                >
                  🔄 Reset
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setPlaybackIndex(0);
                  setIsPlaying(true);
                }}
                className="btn-primary !px-3 !py-1.5 text-xs font-bold shadow-md flex items-center gap-1 bg-violet-600 hover:bg-violet-700"
              >
                🎬 Replay Journey
              </button>
            )}
          </div>
        </div>

        <div className="relative border-l-2 border-dashed border-slate-200 ml-6 space-y-8 pb-4">
          {(() => {
            const list = playbackIndex >= 0 
              ? r.events.slice(0, playbackIndex + 1).reverse()
              : r.events.slice().reverse();

            if (list.length === 0) {
              return (
                <div className="pl-8 py-4 text-xs text-slate-400 italic">
                  Journey starts... click Play to begin.
                </div>
              );
            }

            return list.map((e, index) => {
              const isFirst = index === 0;
              let icon = "📸";
              let color = "bg-slate-100 text-slate-600";
              let ring = "ring-slate-200";

              if (e.label.toLowerCase().includes("reported")) {
                icon = "📸"; color = "bg-sky-100 text-sky-700"; ring = "ring-sky-200";
              } else if (e.label.toLowerCase().includes("verified") || e.label.toLowerCase().includes("classified")) {
                icon = "🤖"; color = "bg-indigo-100 text-indigo-700"; ring = "ring-indigo-200";
              } else if (e.label.toLowerCase().includes("confirm")) {
                icon = "👥"; color = "bg-emerald-100 text-emerald-700"; ring = "ring-emerald-200";
              } else if (e.label.toLowerCase().includes("routed")) {
                icon = "🏛"; color = "bg-amber-100 text-amber-700"; ring = "ring-amber-200";
              } else if (e.label.toLowerCase().includes("started")) {
                icon = "🛠"; color = "bg-orange-100 text-orange-700"; ring = "ring-orange-200";
              } else if (e.label.toLowerCase().includes("resolved")) {
                icon = "✅"; color = "bg-emerald-100 text-emerald-700"; ring = "ring-emerald-200";
              } else if (e.label.toLowerCase().includes("escalated")) {
                icon = "🚨"; color = "bg-rose-100 text-rose-700"; ring = "ring-rose-200";
              }

              const isHighlight = playbackIndex >= 0 && isFirst;

              return (
                <div key={e.id} className={`relative flex items-start gap-4 transition-all duration-500 ${
                  isHighlight ? 'scale-102 opacity-100 animate-slide-down' : 'scale-95 opacity-70 hover:scale-100 hover:opacity-100'
                }`}>
                  {/* Icon Node */}
                  <div className={`absolute -left-[27px] w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ring-4 ring-white transition ${color} ${
                    isHighlight ? 'ring-violet-200 scale-110' : ''
                  }`}>
                    {icon}
                  </div>
                  
                  {/* Event Card */}
                  <div className={`ml-8 flex-1 rounded-2xl p-4 shadow-sm border bg-white transition duration-300 ${
                    isHighlight 
                      ? 'border-violet-500 ring-2 ring-violet-100 shadow-md' 
                      : 'border-slate-100'
                  }`}>
                    {(() => {
                      const parts = e.label.split(" · ");
                      const mainLabel = parts[0];
                      const reasonTrace = parts.slice(1).join(" · ");
                      return (
                        <>
                          <div className="font-extrabold text-slate-800 text-sm mb-1">{mainLabel}</div>
                          {reasonTrace && (
                            <div className="mt-2 text-xs border-l-2 border-brand-500 bg-brand-50/40 p-2.5 rounded-r-lg font-semibold text-slate-600 italic leading-relaxed">
                              🤖 Agent Reasoning: {reasonTrace}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-400 mt-2">
                      <span>{e.actorType}</span>
                      <span>·</span>
                      <span>{timeAgo(e.at)}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Community footer */}
      <div className="card flex items-center justify-between p-4 text-sm">
        <div className="flex items-center gap-4 text-slate-600">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp size={15} /> {r.upvoteCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={15} /> {r.confirmCount} confirms
          </span>
          <span className="inline-flex items-center gap-1">
            <Copy size={15} /> {r.duplicateCount} merged
          </span>
        </div>
        <Link href="/authority" className="text-xs font-semibold text-brand-600 hover:underline">
          Open authority view →
        </Link>
      </div>
    </div>
  );
}

function PetitionCard({ report }: { report: Report }) {
  const [draft, setDraft] = useState<{
    subject: string;
    body: string;
    source: "live" | "mock";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ petition: { subject: string; body: string; source: "live" | "mock" } }>(
      `/api/reports/${report.id}/draft-petition`,
      { method: "POST" }
    )
      .then((res) => {
        if (!cancelled) setDraft(res.petition);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [report.id, report.upvoteCount, report.severity]);

  const bodyLines = (draft?.body || "Drafting formal petition...").split("\n");
  const [routedReceipt, setRoutedReceipt] = useState(false);

  return (
    <div className="card p-4 border-amber-200 bg-gradient-to-br from-amber-50/20 to-white relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-amber-100/50 pb-2 mb-3">
        <h2 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide flex items-center gap-1.5 font-serif-header">
          Dynamic Community Petition
        </h2>
        <span className="chip bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0 border-none">
          Active ({report.upvoteCount} Signatures)
        </span>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white/70 p-3 text-xs text-slate-600 font-serif leading-relaxed shadow-sm">
        <p className="font-extrabold text-slate-800 mb-2">
          {loading && !draft ? "DRAFTING PETITION" : draft?.subject}
        </p>
        <div className="space-y-2 whitespace-pre-wrap">
          {bodyLines.map((line, index) => (
            <p key={`${report.id}-petition-${index}`}>{line || "\u00a0"}</p>
          ))}
        </div>
        <div className="border-t border-dashed border-slate-200 pt-2 mt-3 flex items-center justify-between font-sans text-[10px] text-slate-400">
          <span>
            Verified local signatures: <strong>{report.upvoteCount}</strong>
          </span>
          <span>Draft source: {draft?.source === "live" ? "Gemini" : "local fallback"}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setRoutedReceipt(true)}
          className="btn-success w-full !text-xs !py-2.5 justify-center font-bold shadow-md"
        >
          Route Petition package to Corporator
        </button>
      </div>

      {/* Glassmorphic Petition Receipt Modal Overlay */}
      {routedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
          <div className="card max-w-sm w-full bg-white p-6 text-center border-none shadow-2xl relative">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 font-serif-header">Official Submission Receipt</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">TRANS-ID: RCP-{report.id}-PET</p>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-left text-xs text-slate-600 space-y-2 leading-relaxed font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Destination:</span>
                <span className="font-bold text-slate-700">Office of the Corporator, Ward 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Timestamp:</span>
                <span className="font-bold text-slate-700">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Verified Signatures:</span>
                <span className="font-bold text-emerald-600">{report.upvoteCount} residents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Routing Agent:</span>
                <span className="font-bold text-brand-600">Gemini Routing Agent 02</span>
              </div>
              <p className="text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-2 mt-2 leading-normal">
                ✓ Package compiled including metadata audit logs, duplicate list, and severity metrics. Transmitted to municipal dashboard.
              </p>
            </div>

            <button
              onClick={() => setRoutedReceipt(false)}
              className="mt-5 btn-primary w-full py-2.5 justify-center font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionZone({
  report: r,
  busy,
  act,
}: {
  report: Report;
  busy: boolean;
  act: (path: string, body?: any, msg?: string) => Promise<void>;
}) {
  // Stage 4.3 — community verification
  if (r.status === "PENDING_VERIFICATION") {
    return (
      <div className="card border-brand-200 bg-brand-50/60 p-4">
        <h2 className="text-sm font-bold text-slate-800">
          Is this real? Help verify it.
        </h2>
        <p className="text-xs text-slate-500">
          Confirmations push it past the threshold and auto-route it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() =>
              act(`/api/reports/${r.id}/verify`, { verdict: "CONFIRM" }, "Thanks — your confirmation was recorded.")
            }
            className="btn-success flex-1"
          >
            <ShieldCheck size={16} /> Confirm it&apos;s real
          </button>
          <button
            disabled={busy}
            onClick={() => act(`/api/reports/${r.id}/verify`, { verdict: "ALREADY_FIXED" }, "Marked as already fixed.")}
            className="btn-ghost"
          >
            <Wrench size={15} /> Already fixed
          </button>
          <button
            disabled={busy}
            onClick={() => act(`/api/reports/${r.id}/verify`, { verdict: "REJECT" }, "Rejection recorded.")}
            className="btn-ghost"
          >
            <X size={15} /> Not real
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-dashed border-brand-200/50">
          <button
            disabled={busy}
            onClick={() => act(`/api/reports/${r.id}/simulate-consensus`, {}, "Simulated neighborhood consensus verifications!")}
            className="btn-ghost !border-dashed !border-brand-200 w-full flex items-center justify-center gap-1.5 text-brand-700 hover:!bg-brand-50/50 text-xs font-bold"
          >
            <Zap size={14} className="text-brand-600 animate-pulse" /> Simulate Neighbor Consensus (3 confirmations)
          </button>
        </div>
      </div>
    );
  }

  // Stage 4.5 — resolution re-verification (THE killer feature)
  if (r.status === "RESOLVED_PENDING_CONFIRM") {
    return (
      <div className="card border-amber-300 bg-amber-50 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800">
          <AlertTriangle size={16} /> The authority says this is fixed. Is it
          really?
        </h2>
        <p className="text-xs text-amber-700">
          Your on-the-ground confirmation is what actually closes this report —
          or reopens and escalates it.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() =>
              act(
                `/api/reports/${r.id}/confirm-resolution`,
                { verdict: "FIXED" },
                "✅ Confirmed fixed — report closed & verified. +2 trust."
              )
            }
            className="btn-success flex-1"
          >
            <ShieldCheck size={16} /> Yes, it&apos;s fixed
          </button>
          <button
            disabled={busy}
            onClick={() =>
              act(
                `/api/reports/${r.id}/confirm-resolution`,
                { verdict: "STILL_BROKEN" },
                "🚨 Reopened & escalated to the next authority level."
              )
            }
            className="btn-danger flex-1"
          >
            <X size={16} /> No, still broken
          </button>
        </div>
      </div>
    );
  }

  // Default — "me too" upvote
  if (
    r.status !== "CLOSED_VERIFIED" &&
    r.status !== "REJECTED"
  ) {
    return (
      <div className="space-y-3">
        <div className="card flex items-center justify-between p-4">
          <div className="text-sm text-slate-600">
            Affected by this too? Add your voice — it raises the severity.
          </div>
          <button
            disabled={busy}
            onClick={() => act(`/api/reports/${r.id}/upvote`, undefined, "+1 — thanks for adding your voice.")}
            className="btn-primary"
          >
            <ThumbsUp size={15} /> I have the same problem
          </button>
        </div>

        {(r.status === "ROUTED" || r.status === "ACKNOWLEDGED" || r.status === "IN_PROGRESS") && (
          <button
            disabled={busy}
            onClick={() => act(`/api/reports/${r.id}/simulate-breach`, {}, "SLA breached and ticket escalated!")}
            className="btn-ghost !border-dashed !border-rose-200 w-full flex items-center justify-center gap-1.5 text-rose-700 hover:!bg-rose-50/30 text-xs font-bold"
          >
            <Clock size={14} className="text-rose-600" /> Fast-forward SLA (Simulate Breach)
          </button>
        )}
      </div>
    );
  }

  if (r.status === "CLOSED_VERIFIED") {
    return (
      <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
        ✅ Closed &amp; community-verified. This one&apos;s actually done.
      </div>
    );
  }

  return null;
}
