import { NextResponse } from "next/server";
import { draftPetition } from "@/lib/ai";
import { getDepartment, getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const report = await getReport(params.id);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const department = await getDepartment(report.routedToDepartmentId);
  const petition = await draftPetition({ report, department });

  return NextResponse.json({ petition });
}
