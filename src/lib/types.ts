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
  { label: string; emoji: string }
> = {
  POTHOLE: { label: "Pothole", emoji: "🕳️" },
  STREETLIGHT: { label: "Streetlight", emoji: "💡" },
  WATER_LEAK: { label: "Water Leak", emoji: "💧" },
  SEWAGE: { label: "Sewage", emoji: "🚽" },
  GARBAGE: { label: "Garbage", emoji: "🗑️" },
  STRAY_ANIMAL: { label: "Stray Animal", emoji: "🐕" },
  TRAFFIC_VIOLATION: { label: "Traffic", emoji: "🚦" },
  DAMAGED_SIGNAGE: { label: "Damaged Signage", emoji: "🪧" },
  ENCROACHMENT: { label: "Encroachment", emoji: "🚧" },
  PUBLIC_SAFETY: { label: "Public Safety", emoji: "⚠️" },
  OTHER: { label: "Other", emoji: "📌" },
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
  band: "New" | "Trusted" | "Champion";
  home: GeoPoint;
}
