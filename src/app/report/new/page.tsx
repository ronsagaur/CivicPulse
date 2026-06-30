"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
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
  Brain,
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
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiMetadata | null>(null);
  const [title, setTitle] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);
  const [duplicateMerged, setDuplicateMerged] = useState<{ id: string; reason: string } | null>(null);

  const isVideo = mediaType?.startsWith("video/");

  const [gpsLoc, setGpsLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const loc = useMemo(() => {
    if (gpsLoc) return gpsLoc;
    return { lat: 19.1197 + (Math.random() - 0.5) * 0.006, lng: 72.8468 + (Math.random() - 0.5) * 0.006 };
  }, [gpsLoc]);

  const address = useMemo(() => {
    const landmarks = [
      "Veera Desai Road, near Sports Club, Andheri West",
      "Link Road, opposite City Mall, Andheri West",
      "Juhu Tara Road, near Sun & Sand, Juhu",
      "S V Road, near Railway Station, Andheri West",
      "JP Road, opposite Metro Station, Andheri West",
      "Lallubhai Park Road, near post office, Andheri West"
    ];
    const index = Math.abs(Math.floor((loc.lat + loc.lng) * 100000)) % landmarks.length;
    return landmarks[index];
  }, [loc]);

  const instantPresetAnalysis = (cat: IssueCategory) => {
    setAnalyzing(true);
    setStep(2);
    const sample = SAMPLES.find(s => s.category === cat) || SAMPLES[0];
    setChosen(sample);
    setMediaType("image/png");
    setUploadName(`${cat.toLowerCase()}_evidence.png`);

    const mockAiData: Record<IssueCategory, AiMetadata> = {
      POTHOLE: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "POTHOLE",
        severity: 4,
        confidence: 0.96,
        suggested_title: "Severe Road Craters on MG Road",
        suggested_description: "A deep pothole measuring roughly 1.2 meters wide on the main carriageway. Contains a single loose brick placed by locals as a warning marker. High hazard risk for two-wheelers.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      GARBAGE: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "GARBAGE",
        severity: 3,
        confidence: 0.94,
        suggested_title: "Overflowing Green Municipal Dustbin",
        suggested_description: "Standard municipal waste bin is completely full, with multiple plastic bags spilling onto the footpath. A stray dog was detected sniffing at the debris. Heavy litter scatter.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      WATER_LEAK: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "WATER_LEAK",
        severity: 4,
        confidence: 0.97,
        suggested_title: "Burst Blue PVC Pipeline Spray",
        suggested_description: "A clean municipal water line joint has failed near the sidewalk, resulting in a high-pressure spray of clean water onto the concrete road. Silt and soil erosion beginning.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      SEWAGE: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "SEWAGE",
        severity: 5,
        confidence: 0.92,
        suggested_title: "Open Storm Drain with Murky Runoff",
        suggested_description: "A broken concrete drain slab has collapsed, exposing open sewage flow. High bio-hazard risk. Murky green effluent flowing directly onto pedestrian walkway.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      STREETLIGHT: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "STREETLIGHT",
        severity: 3,
        confidence: 0.95,
        suggested_title: "Flickering Street Lamp near Residential Lane",
        suggested_description: "The streetlamp post is tilted roughly 15 degrees. Warm light source is flickering intermittently, causing complete darkness on the corner intersection at night.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      PUBLIC_SAFETY: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "PUBLIC_SAFETY",
        severity: 4,
        confidence: 0.91,
        suggested_title: "Compromised Perimeter Fence and Barricade",
        suggested_description: "A construction perimeter fence has collapsed onto the public road. Temporary yellow caution tape is wrapped around the hazard, but poses a blockage to traffic.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      TRAFFIC_VIOLATION: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "TRAFFIC_VIOLATION",
        severity: 2,
        confidence: 0.93,
        suggested_title: "Zebra Crossing Blocked by Rickshaw",
        suggested_description: "A yellow-black auto-rickshaw is parked directly over the pedestrian zebra crossing. Foot traffic is being diverted into active vehicle lanes.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      DAMAGED_SIGNAGE: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "DAMAGED_SIGNAGE",
        severity: 2,
        confidence: 0.95,
        suggested_title: "Tilted Street Guideboard Post",
        suggested_description: "Metallic signpost is severely bent and rusted. The text is partially unreadable and the structure is leaning over the pedestrian walkway.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      ENCROACHMENT: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "ENCROACHMENT",
        severity: 3,
        confidence: 0.94,
        suggested_title: "Footpath Blockage by Vendor Cart",
        suggested_description: "A vendor pushcart with a blue tarpaulin cover has occupied the entire sidewalk width, forcing pedestrians to walk on the main road.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      STRAY_ANIMAL: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "STRAY_ANIMAL",
        severity: 2,
        confidence: 0.91,
        suggested_title: "Stray Dog resting near Tea Stall",
        suggested_description: "A friendly stray animal is resting in the middle of a residential road. No immediate danger detected, but poses a minor obstacle for evening vehicles.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      },
      OTHER: {
        is_civic_issue: true,
        is_private_matter: false,
        category: "OTHER",
        severity: 1,
        confidence: 0.90,
        suggested_title: "Unclassified Local Infrastructure Concern",
        suggested_description: "General civic report submitted by resident. System flags for manual routing and review.",
        visual_evidence_quality: "GOOD",
        potential_fraud_signals: [],
        estimated_age_of_issue: "RECENT",
        source: "mock"
      }
    };

    const finalAi = mockAiData[cat] || mockAiData.POTHOLE;

    setTimeout(() => {
      setAi(finalAi);
      setTitle(finalAi.suggested_title);
      setDescription(finalAi.suggested_description);
      setAnalyzing(false);
    }, 100);
  };

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
    setAnalyzeError(null);
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
    } catch (err) {
      console.error("[CivicPulse] Classification failed:", err);
      setAnalyzeError("AI analysis failed. Please try again or go back and reselect.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit() {
    if (!ai) return;
    setSubmitting(true);
    try {
      const res = await api<{
        isDuplicate?: boolean;
        duplicateReportId?: string;
        reason?: string;
        report: Report;
      }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          lat: loc.lat,
          lng: loc.lng,
          isAnonymous: anon,
          addressText: address,
          wardId: "ward-14",
          ai,
          titleOverride: title,
          descriptionOverride: description,
          mediaType: isVideo ? "video" : "image",
          mediaUrl: imageBase64 ? (imageBase64.startsWith("/") ? imageBase64 : `data:${mediaType};base64,${imageBase64}`) : undefined,
        }),
      });

      if (res.isDuplicate) {
        setDuplicateMerged({ id: res.duplicateReportId!, reason: res.reason! });
        setCreated(res.report);
        setStep(3);
      } else {
        setCreated(res.report);
        setStep(3);
      }
    } catch (err) {
      console.error("[CivicPulse] Report submission failed:", err);
      alert("Failed to submit your report. Please check your connection and try again.");
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
          <div className="card p-0 overflow-hidden bg-slate-900 border-slate-800 shadow-2xl relative">
            
            {/* Huge Camera Viewport Simulation */}
            <div className="relative aspect-[4/3] w-full flex flex-col items-center justify-center p-6 text-white overflow-hidden">
              {imageBase64 ? (
                <>
                  {isVideo ? (
                    <video src={imageBase64.startsWith("/") ? imageBase64 : `data:${mediaType};base64,${imageBase64}`} controls className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  ) : (
                    <img src={imageBase64.startsWith("/") ? imageBase64 : `data:${mediaType};base64,${imageBase64}`} alt="Uploaded preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  )}
                  <button onClick={() => { setImageBase64(undefined); setUploadName(null); setMediaType(undefined); }} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:scale-110 transition z-10">
                    <X size={18} />
                  </button>
                </>
              ) : (
                <div className="text-center z-10 w-full px-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 mb-3 animate-pulse">
                    <Camera size={26} className="text-white/80" />
                  </div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Capture Evidence</h2>
                  <p className="text-[10px] text-white/50 mt-1 max-w-[200px] mx-auto">Point your camera at the civic issue, or select a preset below.</p>
                  
                  {/* Preset thumbnails */}
                  <div className="mt-4 flex justify-center gap-2">
                    {[
                      { cat: "POTHOLE" as IssueCategory, label: "Pothole", icon: "/assets/icons/pothole.png" },
                      { cat: "GARBAGE" as IssueCategory, label: "Garbage", icon: "/assets/icons/garbage.png" },
                      { cat: "WATER_LEAK" as IssueCategory, label: "Leak", icon: "/assets/icons/water_leak.png" }
                    ].map((p) => (
                      <button
                        key={p.cat}
                        type="button"
                        onClick={() => {
                          setImageBase64(p.icon);
                          instantPresetAnalysis(p.cat);
                        }}
                        className="flex flex-col items-center bg-black/40 hover:bg-black/60 active:scale-95 border border-white/10 rounded-xl p-1.5 w-16 transition-all"
                      >
                        <div className="relative w-8 h-8">
                          <img src={p.icon} alt={p.label} className="object-contain w-full h-full" />
                        </div>
                        <span className="text-[8px] font-bold text-white/90 mt-1">{p.label}</span>
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-xs font-extrabold shadow-xl hover:scale-105 transition-transform">
                    {isVideo ? <Video size={14} /> : <Upload size={14} />}
                    <span>Open Camera</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} capture="environment" />
                  </label>
                </div>
              )}
              {/* Viewport Frame */}
              <div className="absolute inset-4 border-2 border-white/10 rounded-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full pointer-events-none" />
            </div>
            
            {/* Tactile 3D Category Tray */}
            <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-5 relative z-20 -mt-6 border-t border-white">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />
              <h3 className="text-center text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Or tap a 3D marker</h3>
              
              <div className="grid grid-cols-3 gap-3">
                {SAMPLES.map((s) => {
                  const meta = CATEGORY_META[s.category];
                  const isChosen = chosen?.category === s.category;
                  return (
                    <button
                      key={s.category}
                      onClick={() => {
                        setChosen(s);
                        setUploadName(null);
                        setImageBase64(undefined);
                        setMediaType(undefined);
                      }}
                      className={`relative aspect-square rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-2 overflow-hidden group ${
                        isChosen
                          ? "ring-4 ring-brand-500 scale-105 shadow-xl bg-white"
                          : "ring-1 ring-slate-100 hover:ring-slate-300 bg-slate-50 hover:bg-white shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none" />
                      <div className="relative w-16 h-16 transition-transform duration-500 group-hover:scale-110">
                        <Image src={meta.iconPath} alt={meta.label} fill sizes="64px" className="object-contain drop-shadow-xl" />
                      </div>
                      <span className={`text-center text-[10px] font-extrabold tracking-tight mt-1 z-10 ${isChosen ? "text-brand-700" : "text-slate-600"}`}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-4">
                <button
                  onClick={analyze}
                  disabled={!chosen && !imageBase64}
                  className="btn-primary w-full py-4 text-base shadow-brand-500/25"
                >
                  <Sparkles size={18} /> Analyze Evidence
                </button>
              </div>
            </div>
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
            <div className="card overflow-hidden border border-slate-200/60 shadow-xl">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 font-serif-header">Does this look right?</h2>
                <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">AI Auto-Drafted ✓</span>
              </div>
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
                        src={imageBase64.startsWith("/") ? imageBase64 : `data:${mediaType};base64,${imageBase64}`}
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

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 font-medium">
                  <MapPin size={14} className="text-brand-500" /> {address}
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

      {step === 3 && created && (
        <div className="card animate-fade-in p-6 text-center shadow-xl border border-slate-200/60">
          {duplicateMerged ? (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 border border-brand-100 shadow-inner">
                <Sparkles className="text-brand-600 animate-pulse" size={30} />
              </div>
              <h1 className="mt-3 text-lg font-extrabold font-serif-header text-slate-800">Duplicate Claim Merged!</h1>
              <p className="font-mono text-sm text-slate-500 font-bold mt-1">Merged into: {duplicateMerged.id}</p>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600 space-y-2.5 leading-relaxed border border-slate-100">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Brain size={14} className="text-brand-500" /> Duplicate Detection Agent active
                </p>
                <p>
                  An active ticket describing this exact issue was already reported in your vicinity. To preserve municipal repair crew resources, your ticket has been automatically merged.
                </p>
                <div className="p-2 border border-slate-200/60 rounded bg-white font-semibold text-slate-500">
                  {duplicateMerged.reason}
                </div>
                <p className="text-[10px] text-brand-600 font-extrabold uppercase tracking-wide">
                  ✓ Your upvote & evidence have been added to this ticket!
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Link href={`/report/${duplicateMerged.id}`} className="btn-primary">
                  Track open ticket →
                </Link>
                <Link href="/" className="btn-ghost">
                  Back to map
                </Link>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
