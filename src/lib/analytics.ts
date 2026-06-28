import { getDepartments, getWards, listReports } from "./store";
import type { IssueCategory, Report } from "./types";
import { CATEGORY_META } from "./types";

const RESOLVED_STATES = new Set(["CLOSED_VERIFIED"]);
const ACTIVE_STATES = new Set([
  "PENDING_VERIFICATION",
  "VERIFIED",
  "ROUTED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED_PENDING_CONFIRM",
  "ESCALATED",
]);

function isResolved(r: Report) {
  return RESOLVED_STATES.has(r.status);
}
function isCounted(r: Report) {
  return r.status !== "REJECTED" && r.status !== "PENDING_AI";
}

export interface WardStat {
  wardId: string;
  name: string;
  reported: number;
  resolved: number;
  open: number;
  resolutionRate: number; // 0-100
}

export interface DeptStat {
  departmentId: string;
  name: string;
  shortName: string;
  assigned: number;
  resolved: number;
  overdue: number;
  avgResolutionHours: number | null;
  score: number; // 0-100
}

export interface AnalyticsSummary {
  totals: {
    reported: number;
    resolved: number;
    active: number;
    resolutionRate: number;
    avgResolutionHours: number | null;
    slaBreaches: number;
  };
  wards: WardStat[];
  categories: Array<{ category: IssueCategory; label: string; emoji: string; count: number }>;
  departments: DeptStat[];
  topPerforming: WardStat[];
  needsAttention: WardStat[];
}

function avgHours(reports: Report[]): number | null {
  const done = reports.filter((r) => r.closedAt);
  if (!done.length) return null;
  const total = done.reduce(
    (sum, r) => sum + (+new Date(r.closedAt!) - +new Date(r.createdAt)),
    0
  );
  return +(total / done.length / 3600000).toFixed(1);
}

export async function computeAnalytics(): Promise<AnalyticsSummary> {
  const all = (await listReports()).filter(isCounted);
  const wards = await getWards();
  const departments = await getDepartments();

  const wardStats: WardStat[] = wards.map((w) => {
    const inWard = all.filter((r) => r.wardId === w.id);
    const resolved = inWard.filter(isResolved).length;
    const reported = inWard.length;
    const open = inWard.filter((r) => ACTIVE_STATES.has(r.status)).length;
    return {
      wardId: w.id,
      name: w.name,
      reported,
      resolved,
      open,
      resolutionRate: reported ? Math.round((resolved / reported) * 100) : 0,
    };
  });

  const now = Date.now();
  const deptStats: DeptStat[] = departments
    .filter((d) => d.handlesCategories.length > 0)
    .map((d) => {
      const assignedReports = all.filter((r) => r.routedToDepartmentId === d.id);
      const resolved = assignedReports.filter(isResolved).length;
      const overdue = assignedReports.filter(
        (r) =>
          r.slaDeadline &&
          ACTIVE_STATES.has(r.status) &&
          +new Date(r.slaDeadline) < now
      ).length;
      const assigned = assignedReports.length;
      const resolutionRate = assigned ? resolved / assigned : 0;
      const onTimeRate = assigned ? 1 - overdue / assigned : 1;
      const score = Math.round(resolutionRate * 65 + onTimeRate * 35);
      return {
        departmentId: d.id,
        name: d.name,
        shortName: d.shortName,
        assigned,
        resolved,
        overdue,
        avgResolutionHours: avgHours(assignedReports),
        score: assigned ? score : 0,
      };
    });

  const categoryCounts = new Map<IssueCategory, number>();
  for (const r of all) {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  }
  const categories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_META[category].label,
      emoji: CATEGORY_META[category].emoji,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const reported = all.length;
  const resolved = all.filter(isResolved).length;
  const active = all.filter((r) => ACTIVE_STATES.has(r.status)).length;
  const slaBreaches = all.filter(
    (r) =>
      r.slaDeadline &&
      ACTIVE_STATES.has(r.status) &&
      +new Date(r.slaDeadline) < now
  ).length;

  const ranked = [...wardStats].sort(
    (a, b) => b.resolutionRate - a.resolutionRate
  );

  return {
    totals: {
      reported,
      resolved,
      active,
      resolutionRate: reported ? Math.round((resolved / reported) * 100) : 0,
      avgResolutionHours: avgHours(all),
      slaBreaches,
    },
    wards: wardStats,
    categories,
    departments: deptStats.sort((a, b) => b.score - a.score),
    topPerforming: ranked.slice(0, 2),
    needsAttention: ranked.slice(-2).reverse(),
  };
}
