// ────────────────────────────────────────────────────────────────
// CivicPulse domain types
// Mirrors the lifecycle state machine and schema from the blueprint.
// ────────────────────────────────────────────────────────────────

export type IssueCategory =
  | "POTHOLE"
  | "STREETLIGHT"
  | "WATER_LEAK"
  | "SEWAGE"
  | "GARBAGE"
  | "STRAY_ANIMAL"
  | "TRAFFIC_VIOLATION"
  | "DAMAGED_SIGNAGE"
  | "ENCROACHMENT"
  | "PUBLIC_SAFETY"
  | "OTHER";

export const CATEGORY_META: Record<
  IssueCategory,
  {
    label: string;
    emoji: string;
    iconPath: string;
    colorClass: string;
    bgClass: string;
    dotClass: string;
    hexColor: string;
  }
> = {
  POTHOLE: {
    label: "Pothole",
    emoji: "🕳️",
    iconPath: "/assets/icons/pothole.png",
    colorClass: "slate",
    bgClass: "bg-slate-50 border-slate-200 text-slate-700",
    dotClass: "bg-slate-500",
    hexColor: "#64748b",
  },
  STREETLIGHT: {
    label: "Streetlight",
    emoji: "💡",
    iconPath: "/assets/icons/streetlight.png",
    colorClass: "amber",
    bgClass: "bg-amber-50 border-amber-200 text-amber-700",
    dotClass: "bg-amber-500",
    hexColor: "#f59e0b",
  },
  WATER_LEAK: {
    label: "Water Leak",
    emoji: "💧",
    iconPath: "/assets/icons/water_leak.png",
    colorClass: "blue",
    bgClass: "bg-blue-50 border-blue-200 text-blue-700",
    dotClass: "bg-blue-500",
    hexColor: "#3b82f6",
  },
  SEWAGE: {
    label: "Sewage",
    emoji: "🚽",
    iconPath: "/assets/icons/sewage.png",
    colorClass: "cyan",
    bgClass: "bg-cyan-50 border-cyan-200 text-cyan-700",
    dotClass: "bg-cyan-500",
    hexColor: "#06b6d4",
  },
  GARBAGE: {
    label: "Garbage",
    emoji: "🗑️",
    iconPath: "/assets/icons/garbage.png",
    colorClass: "emerald",
    bgClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    dotClass: "bg-emerald-500",
    hexColor: "#10b981",
  },
  STRAY_ANIMAL: {
    label: "Stray Animal",
    emoji: "🐕",
    iconPath: "/assets/icons/stray_animal.png",
    colorClass: "orange",
    bgClass: "bg-orange-50 border-orange-200 text-orange-700",
    dotClass: "bg-orange-500",
    hexColor: "#b45309",
  },
  TRAFFIC_VIOLATION: {
    label: "Traffic",
    emoji: "🚦",
    iconPath: "/assets/icons/traffic_violation.png",
    colorClass: "slate",
    bgClass: "bg-slate-50 border-slate-200 text-slate-700",
    dotClass: "bg-slate-500",
    hexColor: "#64748b",
  },
  DAMAGED_SIGNAGE: {
    label: "Damaged Signage",
    emoji: "🪧",
    iconPath: "/assets/icons/damaged_signage.png",
    colorClass: "slate",
    bgClass: "bg-slate-50 border-slate-200 text-slate-700",
    dotClass: "bg-slate-500",
    hexColor: "#64748b",
  },
  ENCROACHMENT: {
    label: "Encroachment",
    emoji: "🚧",
    iconPath: "/assets/icons/encroachment.png",
    colorClass: "purple",
    bgClass: "bg-purple-50 border-purple-200 text-purple-700",
    dotClass: "bg-purple-500",
    hexColor: "#8b5cf6",
  },
  PUBLIC_SAFETY: {
    label: "Public Safety",
    emoji: "⚠️",
    iconPath: "/assets/icons/public_safety.png",
    colorClass: "red",
    bgClass: "bg-rose-50 border-rose-200 text-rose-700",
    dotClass: "bg-rose-500",
    hexColor: "#ef4444",
  },
  OTHER: {
    label: "Other",
    emoji: "📌",
    iconPath: "/assets/icons/other.png",
    colorClass: "slate",
    bgClass: "bg-slate-50 border-slate-200 text-slate-700",
    dotClass: "bg-slate-500",
    hexColor: "#475569",
  },
};

// The full lifecycle. Order matters — used to render progress.
export type ReportStatus =
  | "PENDING_AI"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "ROUTED"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED_PENDING_CONFIRM"
  | "CLOSED_VERIFIED"
  | "REJECTED"
  | "ESCALATED";

export const STATUS_META: Record<
  ReportStatus,
  { label: string; tone: "neutral" | "blue" | "amber" | "green" | "red" }
> = {
  PENDING_AI: { label: "Analyzing", tone: "neutral" },
  PENDING_VERIFICATION: { label: "Awaiting verification", tone: "amber" },
  VERIFIED: { label: "Verified", tone: "blue" },
  ROUTED: { label: "Routed", tone: "blue" },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "blue" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  RESOLVED_PENDING_CONFIRM: { label: "Resolved — confirm?", tone: "amber" },
  CLOSED_VERIFIED: { label: "Closed & verified", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
  ESCALATED: { label: "Escalated", tone: "red" },
};

export type Verdict = "CONFIRM" | "REJECT" | "ALREADY_FIXED";
export type ResolutionVerdict = "FIXED" | "STILL_BROKEN" | "PARTIALLY_FIXED";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AiMetadata {
  is_civic_issue: boolean;
  is_private_matter: boolean;
  category: IssueCategory;
  severity: number; // 1-5
  confidence: number; // 0-1
  suggested_title: string;
  suggested_description: string;
  visual_evidence_quality: "GOOD" | "POOR" | "UNUSABLE";
  potential_fraud_signals: string[];
  estimated_age_of_issue: "NEW" | "RECENT" | "CHRONIC";
  source: "live" | "mock"; // demo transparency: which path produced this
}

export interface ReportEvent {
  id: string;
  type: string; // e.g. "REPORTED", "AI_CLASSIFIED", "ROUTED"
  actorType: "USER" | "AUTHORITY" | "SYSTEM";
  actorName?: string;
  label: string; // human-readable line for the timeline
  at: string; // ISO
}

export interface Verification {
  id: string;
  verifierId: string;
  verifierName: string;
  verdict: Verdict;
  trustAtTime: number;
  at: string;
}

export interface ResolutionConfirmation {
  id: string;
  confirmerId: string;
  confirmerName: string;
  verdict: ResolutionVerdict;
  at: string;
}

export interface Report {
  id: string; // e.g. CP-8421
  reporterId: string;
  reporterName: string;
  isAnonymous: boolean;
  title: string;
  description: string;
  category: IssueCategory;
  severity: number;
  status: ReportStatus;
  location: GeoPoint;
  addressText: string;
  wardId: string;
  aiConfidence: number;
  ai?: AiMetadata;
  imagePlaceholder: string; // a tailwind gradient class for the faux photo
  mediaType?: "image" | "video";
  mediaUrl?: string | null;
  parentReportId?: string;
  duplicateCount: number;
  upvoteCount: number;
  confirmCount: number; // community verifications confirming
  routedToDepartmentId?: string;
  slaDeadline?: string; // ISO
  escalationLevel: number;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  events: ReportEvent[];
  verifications: Verification[];
  resolutionConfirmations: ResolutionConfirmation[];
}

export interface Ward {
  id: string;
  name: string;
  city: string;
  state: string;
  center: GeoPoint;
  population: number;
}

export interface Department {
  id: string;
  name: string;
  shortName: string;
  wardId: string;
  handlesCategories: IssueCategory[];
  defaultSlaHours: number;
  escalationToDepartmentId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  trustScore: number;
  band: "Citizen" | "Volunteer" | "Guardian" | "Champion" | "Ward Keeper" | "City Steward" | "Nation Builder";
  home: GeoPoint;
}
