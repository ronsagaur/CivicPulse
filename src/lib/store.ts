import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import type {
  AppUser,
  Department,
  Report,
  ReportEvent,
  ReportStatus,
  ResolutionVerdict,
  Verdict,
  Ward,
} from "./types";
import { AiMetadata } from "./types";
import {
  TRUST_DELTAS,
  applyTrustDelta,
  bandFor,
  confirmationsNeeded,
} from "./trust";

// ── Next.js Database Client Singleton ──
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const CURRENT_USER_ID = "u-you";

// ── Helpers ─────────────────────────────────────────────────────
function now() {
  return new Date();
}

async function getNextReportId(): Promise<string> {
  const latest = await prisma.report.findFirst({
    orderBy: { id: "desc" },
  });
  let nextNum = 8408; // Default first report id after seed (CP-8401 to CP-8407)
  if (latest) {
    const num = parseInt(latest.id.replace("CP-", ""), 10);
    if (Number.isFinite(num)) {
      nextNum = num + 1;
    }
  }
  return `CP-${nextNum}`;
}

function formatDbReport(r: any): Report {
  return {
    id: r.id,
    reporterId: r.reporterId,
    reporterName: r.reporterName,
    isAnonymous: r.isAnonymous,
    title: r.title,
    description: r.description,
    category: r.category as any,
    severity: r.severity,
    status: r.status as ReportStatus,
    location: { lat: r.lat, lng: r.lng },
    addressText: r.addressText,
    wardId: r.wardId,
    aiConfidence: r.aiConfidence,
    ai: r.aiMetadata ? JSON.parse(r.aiMetadata) : undefined,
    imagePlaceholder: r.imagePlaceholder,
    mediaType: r.mediaType as any,
    mediaUrl: r.mediaUrl,
    parentReportId: r.parentReportId || undefined,
    duplicateCount: r.duplicateCount,
    upvoteCount: r.upvoteCount,
    confirmCount: r.confirmCount,
    routedToDepartmentId: r.routedToDepartmentId || undefined,
    slaDeadline: r.slaDeadline ? r.slaDeadline.toISOString() : undefined,
    escalationLevel: r.escalationLevel,
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : undefined,
    closedAt: r.closedAt ? r.closedAt.toISOString() : undefined,
    events: r.events
      ? r.events.map((e: any) => ({
          id: e.id,
          type: e.type,
          actorType: e.actorType as any,
          actorName: e.actorName || undefined,
          label: e.label,
          at: e.at.toISOString(),
        }))
      : [],
    verifications: r.verifications
      ? r.verifications.map((v: any) => ({
          id: v.id,
          verifierId: v.verifierId,
          verifierName: v.verifierName,
          verdict: v.verdict as Verdict,
          trustAtTime: v.trustAtTime,
          at: v.at.toISOString(),
        }))
      : [],
    resolutionConfirmations: r.resolutionConfirmations
      ? r.resolutionConfirmations.map((rc: any) => ({
          id: rc.id,
          confirmerId: rc.confirmerId,
          confirmerName: rc.confirmerName,
          verdict: rc.verdict as ResolutionVerdict,
          at: rc.at.toISOString(),
        }))
      : [],
  };
}

async function addEvent(
  reportId: string,
  type: string,
  actorType: ReportEvent["actorType"],
  label: string,
  actorName?: string
) {
  return prisma.reportEvent.create({
    data: {
      reportId,
      type,
      actorType,
      actorName: actorName || null,
      label,
      at: now(),
    },
  });
}

async function bumpTrust(userId: string, delta: number) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return;
  const newScore = applyTrustDelta(u.trustScore, delta);
  const newBand = bandFor(newScore);
  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: newScore, band: newBand },
  });
}

// ── Reads ───────────────────────────────────────────────────────
export async function getWards(): Promise<Ward[]> {
  const ws = await prisma.ward.findMany();
  return ws.map((w) => ({
    id: w.id,
    name: w.name,
    city: w.city,
    state: w.state,
    center: { lat: w.centerLat, lng: w.centerLng },
    population: w.population,
  }));
}

export async function getDepartments(): Promise<Department[]> {
  const depts = await prisma.department.findMany();
  return depts.map((d) => ({
    id: d.id,
    name: d.name,
    shortName: d.shortName,
    wardId: d.wardId,
    handlesCategories: d.handlesCategories
      ? (d.handlesCategories.split(",") as any[])
      : [],
    defaultSlaHours: d.defaultSlaHours,
    escalationToDepartmentId: d.escalationToDepartmentId || undefined,
  }));
}

export async function getDepartment(id?: string): Promise<Department | null> {
  if (!id) return null;
  const d = await prisma.department.findUnique({ where: { id } });
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    shortName: d.shortName,
    wardId: d.wardId,
    handlesCategories: d.handlesCategories
      ? (d.handlesCategories.split(",") as any[])
      : [],
    defaultSlaHours: d.defaultSlaHours,
    escalationToDepartmentId: d.escalationToDepartmentId || undefined,
  };
}

export async function getUsers(): Promise<AppUser[]> {
  const us = await prisma.user.findMany();
  return us.map((u) => ({
    id: u.id,
    name: u.name,
    trustScore: u.trustScore,
    band: u.band as any,
    home: { lat: u.homeLat, lng: u.homeLng },
  }));
}

export async function getCurrentUserOrNull(): Promise<AppUser | null> {
  const sessionId = cookies().get("civicpulse_session")?.value;
  if (!sessionId) return null;

  const u = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    trustScore: u.trustScore,
    band: u.band as any,
    home: { lat: u.homeLat, lng: u.homeLng },
  };
}

export async function getCurrentUser(): Promise<AppUser> {
  const user = await getCurrentUserOrNull();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export interface ReportFilter {
  status?: ReportStatus[];
  category?: string;
  wardId?: string;
}

export async function listReports(filter: ReportFilter = {}): Promise<Report[]> {
  const where: any = {};
  if (filter.status?.length) {
    where.status = { in: filter.status };
  }
  if (filter.category) {
    where.category = filter.category;
  }
  if (filter.wardId) {
    where.wardId = filter.wardId;
  }

  const list = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      events: true,
      verifications: true,
      resolutionConfirmations: true,
    },
  });

  return list.map(formatDbReport);
}

export async function getReport(id: string): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({
    where: { id },
    include: {
      events: true,
      verifications: true,
      resolutionConfirmations: true,
    },
  });
  return r ? formatDbReport(r) : undefined;
}

// ── Writes ──────────────────────────────────────────────────────
export interface CreateReportInput {
  lat: number;
  lng: number;
  description?: string;
  isAnonymous?: boolean;
  reporterId?: string;
  imagePlaceholder?: string;
  addressText?: string;
  wardId?: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
}

const GRADS = [
  "from-amber-200 to-amber-400",
  "from-slate-300 to-slate-500",
  "from-sky-200 to-sky-400",
  "from-rose-200 to-rose-400",
  "from-emerald-200 to-emerald-400",
];

export async function createReport(input: CreateReportInput): Promise<Report> {
  const reporter = await getCurrentUser();
  const activeWards = await prisma.ward.findMany();
  const ward = activeWards.find((w) => w.id === input.wardId) || activeWards[0];
  
  const id = await getNextReportId();
  const imagePlaceholder = input.imagePlaceholder || GRADS[Math.floor(Math.random() * GRADS.length)];

  const dbReport = await prisma.report.create({
    data: {
      id,
      reporterId: reporter.id,
      reporterName: reporter.name,
      isAnonymous: input.isAnonymous ?? false,
      title: "Analyzing…",
      description: input.description ?? "",
      category: "OTHER",
      severity: 1,
      status: "PENDING_AI",
      lat: input.lat,
      lng: input.lng,
      addressText: input.addressText ?? ward.name,
      wardId: ward.id,
      aiConfidence: 0,
      imagePlaceholder,
      mediaType: input.mediaType || "image",
      mediaUrl: input.mediaUrl || null,
      duplicateCount: 0,
      upvoteCount: 0,
      confirmCount: 0,
      escalationLevel: 0,
      createdAt: now(),
    },
  });

  await addEvent(
    id,
    "REPORTED",
    "USER",
    input.isAnonymous ? "Reported anonymously" : `Reported by ${reporter.name}`,
    input.isAnonymous ? undefined : reporter.name
  );

  return (await getReport(id))!;
}

export async function applyClassification(
  id: string,
  ai: AiMetadata
): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({ where: { id } });
  if (!r) return undefined;

  if (!ai.is_civic_issue || ai.is_private_matter) {
    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: "REJECTED",
        title: ai.suggested_title || "Not a civic issue",
        aiMetadata: JSON.stringify(ai),
        aiConfidence: ai.confidence,
      },
    });

    await addEvent(
      id,
      "AI_REJECTED",
      "SYSTEM",
      ai.is_private_matter
        ? "AI flagged this as a private matter — not routed."
        : "AI could not confirm a civic issue — not routed."
    );

    return (await getReport(id))!;
  }

  await prisma.report.update({
    where: { id },
    data: {
      category: ai.category,
      severity: ai.severity,
      title: ai.suggested_title,
      description: r.description || ai.suggested_description,
      status: "PENDING_VERIFICATION",
      aiMetadata: JSON.stringify(ai),
      aiConfidence: ai.confidence,
    },
  });

  await addEvent(
    id,
    "AI_CLASSIFIED",
    "SYSTEM",
    `AI verified — ${ai.category.replace(/_/g, " ").toLowerCase()}, severity ${ai.severity} (${Math.round(
      ai.confidence * 100
    )}%)${ai.source === "mock" ? " · system classifier" : " · live"}`
  );

  const reporter = await prisma.user.findUnique({ where: { id: r.reporterId } });
  const band = reporter ? (reporter.band as any) : "Trusted";
  const needed = confirmationsNeeded(band);

  await addEvent(
    id,
    "VERIFICATION_STARTED",
    "SYSTEM",
    `Notified nearby neighbours · need ${needed} confirmation${needed > 1 ? "s" : ""}`
  );

  return (await getReport(id))!;
}

async function routeReport(id: string, category: string, wardId: string) {
  const depts = await prisma.department.findMany({ where: { wardId } });
  const dept = depts.find((d) =>
    d.handlesCategories.split(",").includes(category)
  );

  if (dept) {
    const slaDeadline = new Date(
      Date.now() + dept.defaultSlaHours * 3600 * 1000
    );
    await prisma.report.update({
      where: { id },
      data: {
        status: "ROUTED",
        routedToDepartmentId: dept.id,
        slaDeadline,
      },
    });

    await addEvent(
      id,
      "ROUTED",
      "SYSTEM",
      `Routed to ${dept.shortName} · SLA ${dept.defaultSlaHours}h`
    );
  } else {
    await prisma.report.update({
      where: { id },
      data: { status: "ROUTED" },
    });
    await addEvent(id, "ROUTED", "SYSTEM", "Queued for manual routing");
  }
}

export async function verifyReport(
  id: string,
  verifierId: string,
  verdict: Verdict
): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({
    where: { id },
    include: { verifications: true },
  });
  if (!r) return undefined;
  if (r.status !== "PENDING_VERIFICATION") return (await getReport(id))!;

  const verifier = (await prisma.user.findUnique({ where: { id: verifierId } })) || (await getCurrentUser());
  if (r.verifications.some((v) => v.verifierId === verifier.id)) {
    return (await getReport(id))!;
  }

  await prisma.verification.create({
    data: {
      reportId: id,
      verifierId: verifier.id,
      verifierName: verifier.name,
      verdict,
      trustAtTime: verifier.trustScore,
      at: now(),
    },
  });

  // Re-fetch report to count verifications
  const refetched = await prisma.report.findUnique({
    where: { id },
    include: { verifications: true },
  });
  if (!refetched) return undefined;

  const confirms = refetched.verifications.filter((v) => v.verdict === "CONFIRM").length;
  const rejects = refetched.verifications.filter((v) => v.verdict === "REJECT").length;
  const confirmCount = Math.max(refetched.confirmCount, confirms);

  await prisma.report.update({
    where: { id },
    data: { confirmCount },
  });

  if (verdict === "ALREADY_FIXED") {
    await addEvent(id, "ALREADY_FIXED", "USER", `${verifier.name} marked this already fixed`);
  }

  const reporter = await prisma.user.findUnique({ where: { id: r.reporterId } });
  const band = reporter ? (reporter.band as any) : "Trusted";
  const needed = confirmationsNeeded(band);

  if (confirms >= needed) {
    await prisma.report.update({
      where: { id },
      data: { status: "VERIFIED" },
    });
    await addEvent(id, "VERIFIED", "SYSTEM", `${confirms} neighbours confirmed — verified`);
    await bumpTrust(r.reporterId, TRUST_DELTAS.REPORT_VERIFIED);
    await routeReport(id, r.category, r.wardId);
  } else if (rejects >= 2) {
    await prisma.report.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await addEvent(id, "REJECTED", "SYSTEM", "2 rejections — flagged for moderator review");
    await bumpTrust(r.reporterId, TRUST_DELTAS.REPORT_REJECTED_AS_SPAM);
  } else if (verdict === "CONFIRM") {
    await addEvent(
      id,
      "CONFIRMED",
      "USER",
      `${verifier.name} confirmed (${confirms}/${needed})`
    );
  }

  await bumpTrust(verifier.id, TRUST_DELTAS.VERIFICATION_MATCHED_CONSENSUS);

  return (await getReport(id))!;
}

export async function upvoteReport(id: string): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({ where: { id } });
  if (!r) return undefined;

  const nextUpvotes = r.upvoteCount + 1;
  const nextDuplicates = r.duplicateCount + 1;
  let nextSeverity = r.severity;

  let bumpSeverity = false;
  if (nextDuplicates > 0 && nextDuplicates % 10 === 0 && r.severity < 5) {
    nextSeverity += 1;
    bumpSeverity = true;
  }

  await prisma.report.update({
    where: { id },
    data: {
      upvoteCount: nextUpvotes,
      duplicateCount: nextDuplicates,
      severity: nextSeverity,
    },
  });

  if (bumpSeverity) {
    await addEvent(
      id,
      "SEVERITY_BUMPED",
      "SYSTEM",
      `Severity raised to ${nextSeverity} — ${nextDuplicates} citizens affected`
    );
  }

  return (await getReport(id))!;
}

// ── Authority Actions ───────────────────────────────────────────
export type AuthorityAction = "ACKNOWLEDGE" | "START" | "RESOLVE";

export async function authorityAction(
  id: string,
  action: AuthorityAction,
  officerName = "Officer Sharma",
  note?: string
): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({ where: { id } });
  if (!r) return undefined;

  switch (action) {
    case "ACKNOWLEDGE":
      await prisma.report.update({
        where: { id },
        data: { status: "ACKNOWLEDGED" },
      });
      await addEvent(id, "ACKNOWLEDGED", "AUTHORITY", `Acknowledged by ${officerName}`, officerName);
      break;
    case "START":
      await prisma.report.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
      await addEvent(
        id,
        "IN_PROGRESS",
        "AUTHORITY",
        note ? `Work started — ${note}` : "Work started — crew dispatched",
        officerName
      );
      break;
    case "RESOLVE":
      await prisma.report.update({
        where: { id },
        data: {
          status: "RESOLVED_PENDING_CONFIRM",
          resolvedAt: now(),
        },
      });
      await addEvent(
        id,
        "RESOLVED",
        "AUTHORITY",
        "Marked resolved — awaiting community confirmation",
        officerName
      );
      break;
  }

  return (await getReport(id))!;
}

// ── Resolution Re-verification (the killer loop) ────────────────
export async function confirmResolution(
  id: string,
  confirmerId: string,
  verdict: ResolutionVerdict
): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({ where: { id } });
  if (!r) return undefined;
  if (r.status !== "RESOLVED_PENDING_CONFIRM") return (await getReport(id))!;

  const confirmer = (await prisma.user.findUnique({ where: { id: confirmerId } })) || (await getCurrentUser());
  
  await prisma.resolutionConfirmation.create({
    data: {
      reportId: id,
      confirmerId: confirmer.id,
      confirmerName: confirmer.name,
      verdict,
      at: now(),
    },
  });

  if (verdict === "FIXED") {
    await prisma.report.update({
      where: { id },
      data: {
        status: "CLOSED_VERIFIED",
        closedAt: now(),
      },
    });

    await addEvent(
      id,
      "CLOSED_VERIFIED",
      "USER",
      `${confirmer.name} confirmed the fix on the ground ✓`,
      confirmer.name
    );
    await bumpTrust(confirmer.id, TRUST_DELTAS.CONFIRMED_RESOLUTION_MATCH);
  } else {
    // STILL_BROKEN or PARTIALLY_FIXED → reopen and escalate
    await reopenAndEscalate(
      id,
      r.routedToDepartmentId || undefined,
      r.escalationLevel,
      verdict === "PARTIALLY_FIXED"
        ? `${confirmer.name} says only partially fixed`
        : `${confirmer.name} says it's still broken`
    );
  }

  return (await getReport(id))!;
}

async function reopenAndEscalate(
  id: string,
  routedToDepartmentId: string | undefined,
  currentEscalationLevel: number,
  reason: string
) {
  const nextEscalation = currentEscalationLevel + 1;

  let escalateToId: string | null = null;
  if (routedToDepartmentId) {
    const currentDept = await prisma.department.findUnique({
      where: { id: routedToDepartmentId },
    });
    escalateToId = currentDept?.escalationToDepartmentId || null;
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: "ESCALATED",
      escalationLevel: nextEscalation,
      resolvedAt: null,
      routedToDepartmentId: escalateToId || routedToDepartmentId,
    },
  });

  await addEvent(id, "REOPENED", "SYSTEM", `Re-verification failed — ${reason}`);

  if (escalateToId) {
    const escalateToDept = await prisma.department.findUnique({
      where: { id: escalateToId },
    });
    await addEvent(
      id,
      "ESCALATED",
      "SYSTEM",
      `Auto-escalated to ${escalateToDept?.shortName || "next level"} + publicly flagged`
    );
  } else {
    await addEvent(
      id,
      "ESCALATED",
      "SYSTEM",
      "Auto-escalated to next authority level + publicly flagged"
    );
  }
}

export async function reopenReport(id: string): Promise<Report | undefined> {
  const r = await prisma.report.findUnique({ where: { id } });
  if (!r) return undefined;
  await reopenAndEscalate(id, r.routedToDepartmentId || undefined, r.escalationLevel, "manually reopened");
  return (await getReport(id))!;
}

// ── Reset ───────────────────────────────────────────────────────
export async function resetStore() {
  // Triggers seed re-population programmatically by running the main seed method logic
  const { exec } = require("child_process");
  return new Promise<void>((resolve, reject) => {
    exec("npx prisma db push --force-reset && npx ts-node prisma/seed.ts", (err: any) => {
      if (err) {
        console.error("[CivicPulse Reset] Database reset failed:", err);
        reject(err);
      } else {
        console.log("[CivicPulse Reset] Database reset successful.");
        resolve();
      }
    });
  });
}
