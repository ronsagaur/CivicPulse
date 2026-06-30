import { NextResponse } from "next/server";
import { prisma, verifyReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const verifiers = [
    { phone: "9811111111", name: "Pooja Mehta", lat: 19.1197, lng: 72.8468 },
    { phone: "9822222222", name: "Aarav Patel", lat: 19.1197, lng: 72.8468 },
    { phone: "9833333333", name: "Karan Malhotra", lat: 19.1197, lng: 72.8468 },
  ];

  let report: any = null;
  for (const v of verifiers) {
    let user = await prisma.user.findUnique({ where: { phone: v.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: v.phone,
          name: v.name,
          homeLat: v.lat,
          homeLng: v.lng,
          trustScore: 70,
          band: "Champion",
        },
      });
    }
    report = await verifyReport(params.id, user.id, "CONFIRM");
  }

  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}
