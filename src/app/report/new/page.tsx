"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Camera,
  Sparkles,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Upload,
  Video,
  X,
} from "lucide-react";
import { api } from "@/lib/client";
import {
  CATEGORY_META,
  type AiMetadata,
  type IssueCategory,
  type Report,
} from "@/lib/types";
import { BackLink, ProgressDots, SeverityDots } from "@/components/ui";

const SAMPLES: { category: IssueCategory; grad: string; label: string }[] = [
  { category: "POTHOLE", grad: "from-amber-200 to-amber-400", label: "Pothole" },
  { category: "GARBAGE", grad: "from-orange-200 to-orange-400", label: "Garbage" },
  { category: "STREETLIGHT", grad: "from-slate-300 to-slate-500", label: "Streetlight" },
  { category: "WATER_LEAK", grad: "from-sky-200 to-sky-400", label: "Water leak" },
  { category: "SEWAGE", grad: "from-rose-200 to-rose-400", label: "Sewage" },
  { category: "PUBLIC_SAFETY", grad: "from-violet-200 to-violet-400", label: "Hazard" },
];

type Step = 1 | 2 | 3;

export default function ReportFlow() {
  const [step, setStep] = useState<Step>(1);
  const [chosen, setChosen] = useState<(typeof SAMPLES)[number] | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mediaType, setMediaType] = useState<string | undefined>();
  const [description, setDescription] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [ai, setAi] = useState<AiMetadata | null>(null);
  const [title, setTitle] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  const isVideo = mediaType?.startsWith("video/");

  // a stable-ish location for the new report (near ward 14)
  const loc = useMemo(
    () => ({ lat: 19.1197 + (Math.random() - 0.5) * 0.01, lng: 72.8468 + (Math.random() - 0.5) * 0.01 }),
    []
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setMediaType(file.type);
    setChosen(null); // Deselect mock templates if using a real file
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!chosen && !imageBase64) return;
    setAnalyzing(true);
    setStep(2);
    try {
      const { ai } = await api<{ ai: AiMetadata }>("/api/classify-preview", {
        method: "POST",
        body: JSON.stringify({
          categoryHint: chosen?.category,
          description,
          imageBase64,
          mediaType,
        }),
      });
      setAi(ai);
      setTitle(ai.suggested_title);
      if (!description) setDescription(ai.suggested_description);
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit() {
    if (!ai) return;
    setSubmitting(true);
    try {
      const { report } = await api<{ report: Report }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          lat: loc.lat,
          lng: loc.lng,
          isAnonymous: anon,
          addressText: "MG Road, near SV Junction, Andheri W",
          wardId: "ward-14",
          ai,
          titleOverride: title,
          descriptionOverride: description,
          mediaType: isVideo ? "video" : "image",
          mediaUrl: imageBase64 ? `data:${mediaType};base64,${imageBase64}` : undefined,
        }),
      });
      setCreated(report);
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <BackLink href="/" label="Home" />
        <ProgressDots current={step} total={3} />
      </div>

      {/* STEP 1 — capture */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card p-5">
            <h1 className="text-lg font-extrabold">Report an issue</h1>
            <p className="text-sm text-slate-500">
              Snap a photo/video or choose a mock category. Our AI fills in the rest.
            </p>

            {/* Media Preview Box */}
            {imageBase64 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 relative aspect-video bg-slate-900 grid place-items-center shadow-inner">
                {isVideo ? (
                  <video
                    src={`data:${mediaType};base64,${imageBase64}`}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={`data:${mediaType};base64,${imageBase64}`}
                    alt="Uploaded media preview"
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setImageBase64(undefined);
                    setUploadName(null);
                    setMediaType(undefined);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 hover:scale-105 transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.category}
                  onClick={() => {
                    setChosen(s);
                    setUploadName(null);
                    setImageBase64(undefined);
                    setMediaType(undefined);
                  }}
                  className={`relative aspect-square rounded-xl bg-gradient-to-br ${s.grad} ring-2 transition ${
                    chosen?.category === s.category
                      ? "ring-brand-600 scale-[1.02]"
                      : "ring-transparent hover:ring-slate-300"
                  }`}
                >
                  <span className="absolute inset-0 grid place-items-center text-3xl">
                    {CATEGORY_META[s.category].emoji}
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-slate-700/80">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="my-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or upload real media <span className="h-px flex-1 bg-slate-200" />
            </div>

            <label className="btn-ghost w-full cursor-pointer flex items-center justify-center gap-2">
              {isVideo ? <Video size={15} className="text-brand-600" /> : <Upload size={15} />}
              <span className="truncate max-w-[280px]">
                {uploadName ? uploadName : "Upload photo or video"}
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note describing the issue..."
              className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-400"
              rows={2}
            />

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <MapPin size={14} /> Auto-located: MG Road, Andheri W ✓
            </div>

            <button
              onClick={analyze}
              disabled={!chosen && !imageBase64}
              className="btn-primary mt-4 w-full"
            >
              <Sparkles size={16} /> Analyze with Gemini AI
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — AI review */}
      {step === 2 && (
        <div className="space-y-4">
          {analyzing || !ai ? (
            <div className="card grid place-items-center gap-3 p-10 text-center">
              <Loader2 className="animate-spin text-brand-600" size={28} />
              <div className="text-sm font-semibold text-slate-700">
                Gemini AI is analyzing your report...
              </div>
              <div className="text-xs text-slate-400">
                Classifying category · checking duplicate database · determining severity
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div
                className={`flex items-center gap-3 bg-gradient-to-r ${
                  chosen?.grad ?? "from-brand-100 to-brand-200"
                } px-4 py-3`}
              >
                {imageBase64 ? (
                  <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-white/20 relative grid place-items-center shadow-inner">
                    {isVideo ? (
                      <Video size={18} className="text-white animate-pulse" />
                    ) : (
                      <img
                        src={`data:${mediaType};base64,${imageBase64}`}
                        alt="Upload thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/70 text-2xl">
                    {CATEGORY_META[ai.category].emoji}
                  </span>
                )}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    AI detected
                  </div>
                  <div className="text-base font-extrabold text-slate-800">
                    {CATEGORY_META[ai.category].label}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                    <SeverityDots value={ai.severity} /> severity {ai.severity}/5 ·{" "}
                    {Math.round(ai.confidence * 100)}% confident
                  </div>
                </div>
                <span className="ml-auto chip bg-white/80 text-slate-600 ring-white flex items-center gap-1">
                  <Sparkles size={10} className="text-emerald-600" />
                  {ai.source === "live" ? "live AI" : "AI Agent"}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-brand-400"
                  />
                </div>

                {ai.potential_fraud_signals.length > 0 && (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    ⚠️ Fraud signals: {ai.potential_fraud_signals.join(", ")}
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <MapPin size={14} /> MG Road, near SV Junction, Andheri W
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={anon}
                    onChange={(e) => setAnon(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Post anonymously
                </label>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setStep(1)} className="btn-ghost">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="btn-primary flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Camera size={16} />
                    )}
                    Submit report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — confirmation */}
      {step === 3 && created && (
        <div className="card animate-fade-in p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <CheckCircle2 className="text-emerald-600" size={36} />
          </div>
          <h1 className="mt-3 text-lg font-extrabold">Report submitted!</h1>
          <p className="font-mono text-sm text-slate-500">{created.id}</p>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold">Awaiting verification</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Neighbours notified</span>
              <span className="font-semibold">8 nearby</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Civic points</span>
              <span className="font-semibold text-emerald-600">+50 🏆</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Once 3 neighbours confirm, it&apos;s auto-routed to the right
            department with a database SLA clock.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <Link href={`/report/${created.id}`} className="btn-primary">
              Track this report →
            </Link>
            <Link href="/" className="btn-ghost">
              Back to map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
