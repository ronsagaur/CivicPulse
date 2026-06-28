import type {
  AppUser,
  Department,
  Report,
  ReportEvent,
  Ward,
} from "./types";
import { bandFor } from "./trust";

// Relative-time helpers so seeded data always looks "fresh".
const HOUR = 3600 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const ahead = (hours: number) =>
  new Date(Date.now() + hours * HOUR).toISOString();

let eventSeq = 0;
function ev(
  type: string,
  actorType: ReportEvent["actorType"],
  label: string,
  at: string,
  actorName?: string
): ReportEvent {
  return { id: `evt-${++eventSeq}`, type, actorType, label, at, actorName };
}

// ── Wards (Mumbai) ──────────────────────────────────────────────
export const WARDS: Ward[] = [
  {
    id: "ward-14",
    name: "Ward 14 · Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    center: { lat: 19.1197, lng: 72.8468 },
    population: 412000,
  },
  {
    id: "ward-9",
    name: "Ward 9 · Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    center: { lat: 19.0596, lng: 72.8295 },
    population: 308000,
  },
  {
    id: "ward-21",
    name: "Ward 21 · Powai",
    city: "Mumbai",
    state: "Maharashtra",
    center: { lat: 19.1176, lng: 72.906 },
    population: 286000,
  },
  {
    id: "ward-5",
    name: "Ward 5 · Govandi East",
    city: "Mumbai",
    state: "Maharashtra",
    center: { lat: 19.0654, lng: 72.9261 },
    population: 351000,
  },
];

// ── Departments ─────────────────────────────────────────────────
export const DEPARTMENTS: Department[] = [
  {
    id: "dept-pwd-14",
    name: "Public Works Dept · Ward 14",
    shortName: "PWD Ward 14",
    wardId: "ward-14",
    handlesCategories: ["POTHOLE", "DAMAGED_SIGNAGE", "ENCROACHMENT"],
    defaultSlaHours: 72,
    escalationToDepartmentId: "dept-pwd-city",
  },
  {
    id: "dept-water-14",
    name: "Water & Sewerage Board · Ward 14",
    shortName: "Water Board",
    wardId: "ward-14",
    handlesCategories: ["WATER_LEAK", "SEWAGE"],
    defaultSlaHours: 48,
    escalationToDepartmentId: "dept-pwd-city",
  },
  {
    id: "dept-elec-14",
    name: "Electrical Dept · Ward 14",
    shortName: "Electrical",
    wardId: "ward-14",
    handlesCategories: ["STREETLIGHT"],
    defaultSlaHours: 96,
  },
  {
    id: "dept-sanit-14",
    name: "Solid Waste Mgmt · Ward 14",
    shortName: "Sanitation",
    wardId: "ward-14",
    handlesCategories: ["GARBAGE", "STRAY_ANIMAL"],
    defaultSlaHours: 24,
  },
  {
    id: "dept-traffic-14",
    name: "Traffic Police · Ward 14",
    shortName: "Traffic Police",
    wardId: "ward-14",
    handlesCategories: ["TRAFFIC_VIOLATION", "PUBLIC_SAFETY"],
    defaultSlaHours: 12,
  },
  {
    id: "dept-pwd-city",
    name: "Municipal Commissioner's Office",
    shortName: "Commissioner (City)",
    wardId: "ward-14",
    handlesCategories: [],
    defaultSlaHours: 48,
  },
];

export function departmentForCategory(
  category: Report["category"],
  wardId: string
): Department | undefined {
  return (
    DEPARTMENTS.find(
      (d) => d.wardId === wardId && d.handlesCategories.includes(category)
    ) ?? DEPARTMENTS.find((d) => d.handlesCategories.includes(category))
  );
}

// ── Users ───────────────────────────────────────────────────────
function mkUser(id: string, name: string, trust: number, home: any): AppUser {
  return { id, name, trustScore: trust, band: bandFor(trust), home };
}

export const USERS: AppUser[] = [
  mkUser("u-you", "You", 72, { lat: 19.1197, lng: 72.8468 }),
  mkUser("u-priya", "Priya M.", 88, { lat: 19.1185, lng: 72.848 }),
  mkUser("u-arjun", "Arjun K.", 64, { lat: 19.121, lng: 72.845 }),
  mkUser("u-fatima", "Fatima S.", 91, { lat: 19.119, lng: 72.849 }),
  mkUser("u-rohan", "Rohan D.", 55, { lat: 19.1205, lng: 72.8475 }),
  mkUser("u-meera", "Meera J.", 78, { lat: 19.118, lng: 72.846 }),
  mkUser("u-sanjay", "Sanjay P.", 41, { lat: 19.1199, lng: 72.8455 }),
];

// The "current" demo citizen.
export const CURRENT_USER_ID = "u-you";

// ── Reports ─────────────────────────────────────────────────────
const GRADS = [
  "from-amber-200 to-amber-400",
  "from-slate-300 to-slate-500",
  "from-sky-200 to-sky-400",
  "from-rose-200 to-rose-400",
  "from-emerald-200 to-emerald-400",
  "from-orange-200 to-orange-400",
  "from-violet-200 to-violet-400",
];

let cpSeq = 8400;
function nextId() {
  return `CP-${++cpSeq}`;
}

function freshReports(): Report[] {
  const reports: Report[] = [];

  // 1) RESOLVED_PENDING_CONFIRM — the re-verification loop, ready to demo.
  reports.push({
    id: nextId(),
    reporterId: "u-priya",
    reporterName: "Priya M.",
    isAnonymous: false,
    title: "Deep pothole on MG Road near Junction",
    description:
      "~30cm wide pothole filled with rainwater, hazardous for two-wheelers.",
    category: "POTHOLE",
    severity: 4,
    status: "RESOLVED_PENDING_CONFIRM",
    location: { lat: 19.1192, lng: 72.8472 },
    addressText: "MG Road, near SV Junction, Andheri W",
    wardId: "ward-14",
    aiConfidence: 0.92,
    imagePlaceholder: GRADS[0],
    duplicateCount: 11,
    upvoteCount: 47,
    confirmCount: 12,
    routedToDepartmentId: "dept-pwd-14",
    slaDeadline: ahead(20),
    escalationLevel: 0,
    createdAt: ago(54),
    resolvedAt: ago(2),
    events: [
      ev("REPORTED", "USER", "Reported by Priya M.", ago(54), "Priya M."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Pothole, severity 4 (92%)", ago(54)),
      ev("VERIFIED", "SYSTEM", "12 neighbours confirmed", ago(50)),
      ev("ROUTED", "SYSTEM", "Routed to PWD Ward 14 · SLA 72h", ago(50)),
      ev("ACKNOWLEDGED", "AUTHORITY", "Acknowledged by Officer Sharma", ago(44), "Officer Sharma"),
      ev("IN_PROGRESS", "AUTHORITY", "Work started — crew dispatched", ago(26), "Officer Sharma"),
      ev("RESOLVED", "AUTHORITY", "Marked resolved — awaiting community confirmation", ago(2), "Officer Sharma"),
    ],
    verifications: [],
    resolutionConfirmations: [],
  });

  // 2) IN_PROGRESS, SLA at risk
  reports.push({
    id: nextId(),
    reporterId: "u-arjun",
    reporterName: "Arjun K.",
    isAnonymous: false,
    title: "Streetlight out on Lokhandwala back lane",
    description: "Entire stretch dark after 8pm, feels unsafe for women.",
    category: "STREETLIGHT",
    severity: 3,
    status: "IN_PROGRESS",
    location: { lat: 19.1356, lng: 72.8281 },
    addressText: "Lokhandwala Complex, back lane, Andheri W",
    wardId: "ward-14",
    aiConfidence: 0.81,
    imagePlaceholder: GRADS[1],
    duplicateCount: 3,
    upvoteCount: 19,
    confirmCount: 4,
    routedToDepartmentId: "dept-elec-14",
    slaDeadline: ahead(9),
    escalationLevel: 0,
    createdAt: ago(40),
    events: [
      ev("REPORTED", "USER", "Reported by Arjun K.", ago(40), "Arjun K."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Streetlight, severity 3 (81%)", ago(40)),
      ev("VERIFIED", "SYSTEM", "4 neighbours confirmed", ago(36)),
      ev("ROUTED", "SYSTEM", "Routed to Electrical Dept · SLA 96h", ago(36)),
      ev("ACKNOWLEDGED", "AUTHORITY", "Acknowledged by Electrical Dept", ago(30)),
      ev("IN_PROGRESS", "AUTHORITY", "Replacement part ordered", ago(12)),
    ],
    verifications: [],
    resolutionConfirmations: [],
  });

  // 3) OVERDUE / ESCALATED — sewage, severity 5 (the "killer feature" aftermath)
  reports.push({
    id: nextId(),
    reporterId: "u-fatima",
    reporterName: "Fatima S.",
    isAnonymous: false,
    title: "Sewage overflow flooding the footpath",
    description:
      "Raw sewage on the footpath for 6 days. Kids walk through it to school.",
    category: "SEWAGE",
    severity: 5,
    status: "ESCALATED",
    location: { lat: 19.1149, lng: 72.8501 },
    addressText: "Veera Desai Road, near school gate, Andheri W",
    wardId: "ward-14",
    aiConfidence: 0.95,
    imagePlaceholder: GRADS[3],
    duplicateCount: 23,
    upvoteCount: 88,
    confirmCount: 23,
    routedToDepartmentId: "dept-water-14",
    slaDeadline: ago(18),
    escalationLevel: 1,
    createdAt: ago(150),
    events: [
      ev("REPORTED", "USER", "Reported by Fatima S.", ago(150), "Fatima S."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Sewage, severity 5 (95%)", ago(150)),
      ev("VERIFIED", "SYSTEM", "23 neighbours confirmed", ago(148)),
      ev("ROUTED", "SYSTEM", "Routed to Water Board · SLA 48h", ago(148)),
      ev("ACKNOWLEDGED", "AUTHORITY", "Acknowledged by Water Board", ago(140)),
      ev("RESOLVED", "AUTHORITY", "Marked resolved by Water Board", ago(96)),
      ev("REOPENED", "SYSTEM", "Community re-verification FAILED — 8 of 9 said 'still broken'", ago(90)),
      ev("ESCALATED", "SYSTEM", "Auto-escalated to Municipal Commissioner + publicly flagged", ago(90)),
    ],
    verifications: [],
    resolutionConfirmations: [],
  });

  // 4) PENDING_VERIFICATION — needs neighbours (demo target for "verify")
  reports.push({
    id: nextId(),
    reporterId: "u-rohan",
    reporterName: "Rohan D.",
    isAnonymous: false,
    title: "Overflowing garbage bins at market",
    description: "Bins haven't been cleared in 4 days, stray dogs scattering it.",
    category: "GARBAGE",
    severity: 3,
    status: "PENDING_VERIFICATION",
    location: { lat: 19.1221, lng: 72.8442 },
    addressText: "Andheri Market, Station Road",
    wardId: "ward-14",
    aiConfidence: 0.87,
    imagePlaceholder: GRADS[5],
    duplicateCount: 1,
    upvoteCount: 6,
    confirmCount: 2,
    escalationLevel: 0,
    createdAt: ago(3),
    events: [
      ev("REPORTED", "USER", "Reported by Rohan D.", ago(3), "Rohan D."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Garbage, severity 3 (87%)", ago(3)),
      ev("VERIFICATION_STARTED", "SYSTEM", "Notified 8 neighbours · need 3 confirmations", ago(3)),
    ],
    verifications: [
      {
        id: "vf-seed-1",
        verifierId: "u-meera",
        verifierName: "Meera J.",
        verdict: "CONFIRM",
        trustAtTime: 78,
        at: ago(2.4),
      },
      {
        id: "vf-seed-2",
        verifierId: "u-fatima",
        verifierName: "Fatima S.",
        verdict: "CONFIRM",
        trustAtTime: 91,
        at: ago(1.8),
      },
    ],
    resolutionConfirmations: [],
  });

  // 5) CLOSED_VERIFIED — a clean win for the ledger
  reports.push({
    id: nextId(),
    reporterId: "u-meera",
    reporterName: "Meera J.",
    isAnonymous: false,
    title: "Damaged stop sign at school crossing",
    description: "Stop sign bent flat, drivers ignoring the crossing.",
    category: "DAMAGED_SIGNAGE",
    severity: 4,
    status: "CLOSED_VERIFIED",
    location: { lat: 19.1168, lng: 72.8505 },
    addressText: "JP Road, school crossing, Andheri W",
    wardId: "ward-14",
    aiConfidence: 0.9,
    imagePlaceholder: GRADS[6],
    duplicateCount: 2,
    upvoteCount: 31,
    confirmCount: 7,
    routedToDepartmentId: "dept-pwd-14",
    escalationLevel: 0,
    createdAt: ago(220),
    resolvedAt: ago(60),
    closedAt: ago(50),
    events: [
      ev("REPORTED", "USER", "Reported by Meera J.", ago(220), "Meera J."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Damaged signage, severity 4 (90%)", ago(220)),
      ev("VERIFIED", "SYSTEM", "7 neighbours confirmed", ago(216)),
      ev("ROUTED", "SYSTEM", "Routed to PWD Ward 14", ago(216)),
      ev("IN_PROGRESS", "AUTHORITY", "New sign installed", ago(64)),
      ev("RESOLVED", "AUTHORITY", "Marked resolved by PWD Ward 14", ago(60)),
      ev("CLOSED_VERIFIED", "USER", "2 of 3 citizens confirmed the fix ✓", ago(50)),
    ],
    verifications: [],
    resolutionConfirmations: [
      {
        id: "rc-seed-1",
        confirmerId: "u-you",
        confirmerName: "You",
        verdict: "FIXED",
        at: ago(50),
      },
    ],
  });

  // 6) Another in-progress in a different ward (for ledger spread)
  reports.push({
    id: nextId(),
    reporterId: "u-sanjay",
    reporterName: "Sanjay P.",
    isAnonymous: true,
    title: "Water main leak wasting water",
    description: "Pipe leaking onto the road non-stop for two days.",
    category: "WATER_LEAK",
    severity: 4,
    status: "ACKNOWLEDGED",
    location: { lat: 19.0601, lng: 72.831 },
    addressText: "Hill Road, Bandra W",
    wardId: "ward-9",
    aiConfidence: 0.84,
    imagePlaceholder: GRADS[2],
    duplicateCount: 4,
    upvoteCount: 22,
    confirmCount: 5,
    routedToDepartmentId: "dept-water-14",
    slaDeadline: ahead(30),
    escalationLevel: 0,
    createdAt: ago(20),
    events: [
      ev("REPORTED", "USER", "Reported anonymously", ago(20)),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Water leak, severity 4 (84%)", ago(20)),
      ev("VERIFIED", "SYSTEM", "5 neighbours confirmed", ago(18)),
      ev("ROUTED", "SYSTEM", "Routed to Water Board · SLA 48h", ago(18)),
      ev("ACKNOWLEDGED", "AUTHORITY", "Acknowledged by Water Board", ago(10)),
    ],
    verifications: [],
    resolutionConfirmations: [],
  });

  // 7) Fresh PENDING_VERIFICATION near "you" (a second verify target)
  reports.push({
    id: nextId(),
    reporterId: "u-arjun",
    reporterName: "Arjun K.",
    isAnonymous: false,
    title: "Open manhole missing its cover",
    description: "Uncovered manhole right on the pedestrian path. Very dangerous.",
    category: "PUBLIC_SAFETY",
    severity: 5,
    status: "PENDING_VERIFICATION",
    location: { lat: 19.1203, lng: 72.8459 },
    addressText: "DN Nagar, near metro exit, Andheri W",
    wardId: "ward-14",
    aiConfidence: 0.93,
    imagePlaceholder: GRADS[4],
    duplicateCount: 0,
    upvoteCount: 3,
    confirmCount: 0,
    escalationLevel: 0,
    createdAt: ago(0.6),
    events: [
      ev("REPORTED", "USER", "Reported by Arjun K.", ago(0.6), "Arjun K."),
      ev("AI_CLASSIFIED", "SYSTEM", "AI verified — Public safety, severity 5 (93%)", ago(0.6)),
      ev("VERIFICATION_STARTED", "SYSTEM", "Notified 10 neighbours · need 3 confirmations", ago(0.6)),
    ],
    verifications: [],
    resolutionConfirmations: [],
  });

  return reports;
}

export function freshSeed() {
  // reset sequences so repeated reseeds are stable within a process lifetime
  cpSeq = 8400;
  eventSeq = 0;
  return {
    wards: WARDS,
    departments: DEPARTMENTS,
    users: JSON.parse(JSON.stringify(USERS)) as AppUser[],
    reports: freshReports(),
  };
}
