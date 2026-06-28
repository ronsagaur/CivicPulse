import { NextResponse } from "next/server";
import { getDepartment, getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const report = await getReport(params.id);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const department = await getDepartment(report.routedToDepartmentId);
  return NextResponse.json({ report, department: department ?? null });
}
