"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
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

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <BackLink href="/" label="Map" />
        <button className="btn-ghost !px-3 !py-1.5 text-xs">
          <Share2 size={14} /> Share
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
      {r.upvoteCount >= 5 && (
        <div className="card p-4 border-amber-200 bg-gradient-to-br from-amber-50/20 to-white relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-100/50 pb-2 mb-3">
            <h2 className="text-xs font-extrabold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
              📜 Automated Community Petition
            </h2>
            <span className="chip bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0 border-none">
              Active ({r.upvoteCount} Signatures)
            </span>
          </div>
          
          <div className="rounded-xl border border-slate-100 bg-white/70 p-3 text-xs text-slate-600 font-serif leading-relaxed shadow-sm">
            <p className="font-extrabold text-slate-800 mb-2">MEMORANDUM OF GRIEVANCE</p>
            <p className="mb-1.5"><strong>TO:</strong> Municipal Corporator &amp; MLA, Andheri West Ward 14</p>
            <p className="mb-2">We, the undersigned residents, formally petition for immediate structural remediation regarding: <strong className="font-sans text-slate-800">{r.title}</strong> (ID: {r.id}). This issue represents a documented severity level of {r.severity}/5, representing a hazard to neighborhood safety.</p>
            <div className="border-t border-dashed border-slate-200 pt-2 flex items-center justify-between font-sans text-[10px] text-slate-400">
              <span>Verified local signatures: <strong>{r.upvoteCount}</strong></span>
              <span>Authentication: Civic consensus ledger ✓</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => alert(`Official petition for ${r.id} successfully compiled and routed to Ward MLA and Local Corporator!`)}
              className="btn-success w-full !text-xs !py-2 justify-center"
            >
              ✉️ Route Petition package to MLA
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Timeline · immutable audit log
        </h2>
        <ol className="space-y-3">
          {r.events
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      e.actorType === "AUTHORITY"
                        ? "bg-brand-600"
                        : e.actorType === "SYSTEM"
                        ? "bg-slate-400"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="w-px flex-1 bg-slate-200" />
                </div>
                <div className="-mt-0.5 pb-1">
                  <div className="text-sm text-slate-700">{e.label}</div>
                  <div className="text-[11px] text-slate-400">
                    {e.actorType.toLowerCase()} · {timeAgo(e.at)}
                  </div>
                </div>
              </li>
            ))}
        </ol>
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
