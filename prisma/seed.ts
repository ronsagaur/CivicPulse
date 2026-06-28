import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 3600 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);
const ahead = (hours: number) => new Date(Date.now() + hours * HOUR);

async function main() {
  // Clear tables
  await prisma.verification.deleteMany();
  await prisma.resolutionConfirmation.deleteMany();
  await prisma.reportEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.ward.deleteMany();

  // Wards
  const wards = [
    { id: "ward-14", name: "Ward 14 · Andheri West", city: "Mumbai", state: "Maharashtra", centerLat: 19.1197, centerLng: 72.8468, population: 412000 },
    { id: "ward-9", name: "Ward 9 · Bandra West", city: "Mumbai", state: "Maharashtra", centerLat: 19.0596, centerLng: 72.8295, population: 308000 },
    { id: "ward-21", name: "Ward 21 · Powai", city: "Mumbai", state: "Maharashtra", centerLat: 19.1176, centerLng: 72.906, population: 286000 },
    { id: "ward-5", name: "Ward 5 · Govandi East", city: "Mumbai", state: "Maharashtra", centerLat: 19.0654, centerLng: 72.9261, population: 351000 }
  ];

  for (const w of wards) {
    await prisma.ward.create({ data: w });
  }

  // Departments
  const departments = [
    { id: "dept-pwd-14", name: "Public Works Dept · Ward 14", shortName: "PWD Ward 14", wardId: "ward-14", handlesCategories: "POTHOLE,DAMAGED_SIGNAGE,ENCROACHMENT", defaultSlaHours: 72, escalationToDepartmentId: "dept-pwd-city" },
    { id: "dept-water-14", name: "Water & Sewerage Board · Ward 14", shortName: "Water Board", wardId: "ward-14", handlesCategories: "WATER_LEAK,SEWAGE", defaultSlaHours: 48, escalationToDepartmentId: "dept-pwd-city" },
    { id: "dept-elec-14", name: "Electrical Dept · Ward 14", shortName: "Electrical", wardId: "ward-14", handlesCategories: "STREETLIGHT", defaultSlaHours: 96 },
    { id: "dept-sanit-14", name: "Solid Waste Mgmt · Ward 14", shortName: "Sanitation", wardId: "ward-14", handlesCategories: "GARBAGE,STRAY_ANIMAL", defaultSlaHours: 24 },
    { id: "dept-traffic-14", name: "Traffic Police · Ward 14", shortName: "Traffic Police", wardId: "ward-14", handlesCategories: "TRAFFIC_VIOLATION,PUBLIC_SAFETY", defaultSlaHours: 12 },
    { id: "dept-pwd-city", name: "Municipal Commissioner's Office", shortName: "Commissioner (City)", wardId: "ward-14", handlesCategories: "", defaultSlaHours: 48 }
  ];

  for (const d of departments) {
    await prisma.department.create({ data: d });
  }

  // Users
  const users = [
    { id: "u-you", phone: "+919876543210", name: "You", trustScore: 72, band: "Champion", homeLat: 19.1197, homeLng: 72.8468, language: "en", isAnonymousDefault: false },
    { id: "u-priya", phone: "+919876543211", name: "Priya M.", trustScore: 88, band: "Champion", homeLat: 19.1185, homeLng: 72.848, language: "en", isAnonymousDefault: false },
    { id: "u-arjun", phone: "+919876543212", name: "Arjun K.", trustScore: 64, band: "Trusted", homeLat: 19.121, homeLng: 72.845, language: "en", isAnonymousDefault: false },
    { id: "u-fatima", phone: "+919876543213", name: "Fatima S.", trustScore: 91, band: "Champion", homeLat: 19.119, homeLng: 72.849, language: "en", isAnonymousDefault: false },
    { id: "u-rohan", phone: "+919876543214", name: "Rohan D.", trustScore: 55, band: "Trusted", homeLat: 19.1205, homeLng: 72.8475, language: "en", isAnonymousDefault: false },
    { id: "u-meera", phone: "+919876543215", name: "Meera J.", trustScore: 78, band: "Champion", homeLat: 19.118, homeLng: 72.846, language: "en", isAnonymousDefault: false },
    { id: "u-sanjay", phone: "+919876543216", name: "Sanjay P.", trustScore: 41, band: "Trusted", homeLat: 19.1199, homeLng: 72.8455, language: "en", isAnonymousDefault: false }
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  // Reports
  const reportsSeed = [
    // 1) RESOLVED_PENDING_CONFIRM
    {
      id: "CP-8401",
      reporterId: "u-priya",
      reporterName: "Priya M.",
      isAnonymous: false,
      title: "Deep pothole on MG Road near Junction",
      description: "~30cm wide pothole filled with rainwater, hazardous for two-wheelers.",
      category: "POTHOLE",
      severity: 4,
      status: "RESOLVED_PENDING_CONFIRM",
      lat: 19.1192,
      lng: 72.8472,
      addressText: "MG Road, near SV Junction, Andheri W",
      wardId: "ward-14",
      aiConfidence: 0.92,
      imagePlaceholder: "from-amber-200 to-amber-400",
      mediaType: "image",
      duplicateCount: 11,
      upvoteCount: 47,
      confirmCount: 12,
      routedToDepartmentId: "dept-pwd-14",
      slaDeadline: ahead(20),
      escalationLevel: 0,
      createdAt: ago(54),
      resolvedAt: ago(2),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Priya M.", label: "Reported by Priya M.", at: ago(54) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Pothole, severity 4 (92%)", at: ago(54) },
        { type: "VERIFIED", actorType: "SYSTEM", label: "12 neighbours confirmed", at: ago(50) },
        { type: "ROUTED", actorType: "SYSTEM", label: "Routed to PWD Ward 14 · SLA 72h", at: ago(50) },
        { type: "ACKNOWLEDGED", actorType: "AUTHORITY", actorName: "Officer Sharma", label: "Acknowledged by Officer Sharma", at: ago(44) },
        { type: "IN_PROGRESS", actorType: "AUTHORITY", actorName: "Officer Sharma", label: "Work started — crew dispatched", at: ago(26) },
        { type: "RESOLVED", actorType: "AUTHORITY", actorName: "Officer Sharma", label: "Marked resolved — awaiting community confirmation", at: ago(2) }
      ]
    },
    // 2) IN_PROGRESS
    {
      id: "CP-8402",
      reporterId: "u-arjun",
      reporterName: "Arjun K.",
      isAnonymous: false,
      title: "Streetlight out on Lokhandwala back lane",
      description: "Entire stretch dark after 8pm, feels unsafe for women.",
      category: "STREETLIGHT",
      severity: 3,
      status: "IN_PROGRESS",
      lat: 19.1356,
      lng: 72.8281,
      addressText: "Lokhandwala Complex, back lane, Andheri W",
      wardId: "ward-14",
      aiConfidence: 0.81,
      imagePlaceholder: "from-slate-300 to-slate-500",
      mediaType: "image",
      duplicateCount: 3,
      upvoteCount: 19,
      confirmCount: 4,
      routedToDepartmentId: "dept-elec-14",
      slaDeadline: ahead(9),
      escalationLevel: 0,
      createdAt: ago(40),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Arjun K.", label: "Reported by Arjun K.", at: ago(40) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Streetlight, severity 3 (81%)", at: ago(40) },
        { type: "VERIFIED", actorType: "SYSTEM", label: "4 neighbours confirmed", at: ago(36) },
        { type: "ROUTED", actorType: "SYSTEM", label: "Routed to Electrical Dept · SLA 96h", at: ago(36) },
        { type: "ACKNOWLEDGED", actorType: "AUTHORITY", label: "Acknowledged by Electrical Dept", at: ago(30) },
        { type: "IN_PROGRESS", actorType: "AUTHORITY", label: "Replacement part ordered", at: ago(12) }
      ]
    },
    // 3) ESCALATED
    {
      id: "CP-8403",
      reporterId: "u-fatima",
      reporterName: "Fatima S.",
      isAnonymous: false,
      title: "Sewage overflow flooding the footpath",
      description: "Raw sewage on the footpath for 6 days. Kids walk through it to school.",
      category: "SEWAGE",
      severity: 5,
      status: "ESCALATED",
      lat: 19.1149,
      lng: 72.8501,
      addressText: "Veera Desai Road, near school gate, Andheri W",
      wardId: "ward-14",
      aiConfidence: 0.95,
      imagePlaceholder: "from-rose-200 to-rose-400",
      mediaType: "image",
      duplicateCount: 23,
      upvoteCount: 88,
      confirmCount: 23,
      routedToDepartmentId: "dept-water-14",
      slaDeadline: ago(18),
      escalationLevel: 1,
      createdAt: ago(150),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Fatima S.", label: "Reported by Fatima S.", at: ago(150) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Sewage, severity 5 (95%)", at: ago(150) },
        { type: "VERIFIED", actorType: "SYSTEM", label: "23 neighbours confirmed", at: ago(148) },
        { type: "ROUTED", actorType: "SYSTEM", label: "Routed to Water Board · SLA 48h", at: ago(148) },
        { type: "ACKNOWLEDGED", actorType: "AUTHORITY", label: "Acknowledged by Water Board", at: ago(140) },
        { type: "RESOLVED", actorType: "AUTHORITY", label: "Marked resolved by Water Board", at: ago(96) },
        { type: "REOPENED", actorType: "SYSTEM", label: "Community re-verification FAILED — 8 of 9 said 'still broken'", at: ago(90) },
        { type: "ESCALATED", actorType: "SYSTEM", label: "Auto-escalated to Municipal Commissioner + publicly flagged", at: ago(90) }
      ]
    },
    // 4) PENDING_VERIFICATION
    {
      id: "CP-8404",
      reporterId: "u-rohan",
      reporterName: "Rohan D.",
      isAnonymous: false,
      title: "Overflowing garbage bins at market",
      description: "Bins haven't been cleared in 4 days, stray dogs scattering it.",
      category: "GARBAGE",
      severity: 3,
      status: "PENDING_VERIFICATION",
      lat: 19.1221,
      lng: 72.8442,
      addressText: "Andheri Market, Station Road",
      wardId: "ward-14",
      aiConfidence: 0.87,
      imagePlaceholder: "from-orange-200 to-orange-400",
      mediaType: "image",
      duplicateCount: 1,
      upvoteCount: 6,
      confirmCount: 2,
      escalationLevel: 0,
      createdAt: ago(3),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Rohan D.", label: "Reported by Rohan D.", at: ago(3) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Garbage, severity 3 (87%)", at: ago(3) },
        { type: "VERIFICATION_STARTED", actorType: "SYSTEM", label: "Notified 8 neighbours · need 3 confirmations", at: ago(3) }
      ],
      verifications: [
        { verifierId: "u-meera", verifierName: "Meera J.", verdict: "CONFIRM", trustAtTime: 78, at: ago(2.4) },
        { verifierId: "u-fatima", verifierName: "Fatima S.", verdict: "CONFIRM", trustAtTime: 91, at: ago(1.8) }
      ]
    },
    // 5) CLOSED_VERIFIED
    {
      id: "CP-8405",
      reporterId: "u-meera",
      reporterName: "Meera J.",
      isAnonymous: false,
      title: "Damaged stop sign at school crossing",
      description: "Stop sign bent flat, drivers ignoring the crossing.",
      category: "DAMAGED_SIGNAGE",
      severity: 4,
      status: "CLOSED_VERIFIED",
      lat: 19.1168,
      lng: 72.8505,
      addressText: "JP Road, school crossing, Andheri W",
      wardId: "ward-14",
      aiConfidence: 0.9,
      imagePlaceholder: "from-violet-200 to-violet-400",
      mediaType: "image",
      duplicateCount: 2,
      upvoteCount: 31,
      confirmCount: 7,
      routedToDepartmentId: "dept-pwd-14",
      escalationLevel: 0,
      createdAt: ago(220),
      resolvedAt: ago(60),
      closedAt: ago(50),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Meera J.", label: "Reported by Meera J.", at: ago(220) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Damaged signage, severity 4 (90%)", at: ago(220) },
        { type: "VERIFIED", actorType: "SYSTEM", label: "7 neighbours confirmed", at: ago(216) },
        { type: "ROUTED", actorType: "SYSTEM", label: "Routed to PWD Ward 14", at: ago(216) },
        { type: "IN_PROGRESS", actorType: "AUTHORITY", label: "New sign installed", at: ago(64) },
        { type: "RESOLVED", actorType: "AUTHORITY", label: "Marked resolved by PWD Ward 14", at: ago(60) },
        { type: "CLOSED_VERIFIED", actorType: "USER", actorName: "You", label: "2 of 3 citizens confirmed the fix ✓", at: ago(50) }
      ],
      resolutionConfirmations: [
        { confirmerId: "u-you", confirmerName: "You", verdict: "FIXED", at: ago(50) }
      ]
    },
    // 6) ACKNOWLEDGED in another ward
    {
      id: "CP-8406",
      reporterId: "u-sanjay",
      reporterName: "Sanjay P.",
      isAnonymous: true,
      title: "Water main leak wasting water",
      description: "Pipe leaking onto the road non-stop for two days.",
      category: "WATER_LEAK",
      severity: 4,
      status: "ACKNOWLEDGED",
      lat: 19.0601,
      lng: 72.831,
      addressText: "Hill Road, Bandra W",
      wardId: "ward-9",
      aiConfidence: 0.84,
      imagePlaceholder: "from-sky-200 to-sky-400",
      mediaType: "image",
      duplicateCount: 4,
      upvoteCount: 22,
      confirmCount: 5,
      routedToDepartmentId: "dept-water-14",
      slaDeadline: ahead(30),
      escalationLevel: 0,
      createdAt: ago(20),
      events: [
        { type: "REPORTED", actorType: "USER", label: "Reported anonymously", at: ago(20) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Water leak, severity 4 (84%)", at: ago(20) },
        { type: "VERIFIED", actorType: "SYSTEM", label: "5 neighbours confirmed", at: ago(18) },
        { type: "ROUTED", actorType: "SYSTEM", label: "Routed to Water Board · SLA 48h", at: ago(18) },
        { type: "ACKNOWLEDGED", actorType: "AUTHORITY", label: "Acknowledged by Water Board", at: ago(10) }
      ]
    },
    // 7) PENDING_VERIFICATION (second target)
    {
      id: "CP-8407",
      reporterId: "u-arjun",
      reporterName: "Arjun K.",
      isAnonymous: false,
      title: "Open manhole missing its cover",
      description: "Uncovered manhole right on the pedestrian path. Very dangerous.",
      category: "PUBLIC_SAFETY",
      severity: 5,
      status: "PENDING_VERIFICATION",
      lat: 19.1203,
      lng: 72.8459,
      addressText: "DN Nagar, near metro exit, Andheri W",
      wardId: "ward-14",
      aiConfidence: 0.93,
      imagePlaceholder: "from-emerald-200 to-emerald-400",
      mediaType: "image",
      duplicateCount: 0,
      upvoteCount: 3,
      confirmCount: 0,
      escalationLevel: 0,
      createdAt: ago(0.6),
      events: [
        { type: "REPORTED", actorType: "USER", actorName: "Arjun K.", label: "Reported by Arjun K.", at: ago(0.6) },
        { type: "AI_CLASSIFIED", actorType: "SYSTEM", label: "AI verified — Public safety, severity 5 (93%)", at: ago(0.6) },
        { type: "VERIFICATION_STARTED", actorType: "SYSTEM", label: "Notified 10 neighbours · need 3 confirmations", at: ago(0.6) }
      ]
    }
  ];

  for (const r of reportsSeed) {
    const { events, verifications, resolutionConfirmations, ...reportData } = r;
    const createdReport = await prisma.report.create({
      data: reportData
    });

    if (events) {
      for (const e of events) {
        await prisma.reportEvent.create({
          data: {
            reportId: createdReport.id,
            type: e.type,
            actorType: e.actorType,
            actorName: e.actorName ?? null,
            label: e.label,
            at: e.at
          }
        });
      }
    }

    if (verifications) {
      for (const v of verifications) {
        await prisma.verification.create({
          data: {
            reportId: createdReport.id,
            verifierId: v.verifierId,
            verifierName: v.verifierName,
            verdict: v.verdict,
            trustAtTime: v.trustAtTime,
            at: v.at
          }
        });
      }
    }

    if (resolutionConfirmations) {
      for (const rc of resolutionConfirmations) {
        await prisma.resolutionConfirmation.create({
          data: {
            reportId: createdReport.id,
            confirmerId: rc.confirmerId,
            confirmerName: rc.confirmerName,
            verdict: rc.verdict,
            at: rc.at
          }
        });
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
