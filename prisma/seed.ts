import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOUR = 3600 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);
const ahead = (hours: number) => new Date(Date.now() + hours * HOUR);

export async function runSeed(prisma: PrismaClient) {
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

  await prisma.ward.createMany({ data: wards });
  await prisma.department.createMany({ data: departments });
  await prisma.user.createMany({ data: users });

  await Promise.all(
    reportsSeed.map((r) => {
      const { events, verifications, resolutionConfirmations, ...reportData } = r;
      return prisma.report.create({
        data: {
          ...reportData,
          events: events ? { create: events } : undefined,
          verifications: verifications ? { create: verifications } : undefined,
          resolutionConfirmations: resolutionConfirmations ? { create: resolutionConfirmations } : undefined,
        },
      });
    })
  );

  console.log("Seeding complete!");
}

async function main() {
  await runSeed(prisma);
}

const isDirectRun =
  (typeof require !== "undefined" && require.main === module) ||
  (process.argv[1] &&
    (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js") || process.argv[1].includes("prisma/seed")));

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
