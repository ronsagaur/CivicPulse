import { NextResponse } from "next/server";
import { reopenReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await reopenReport(params.id);
    if (!report) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[POST /api/reports/${params.id}/reopen] Error:`, err);
    return NextResponse.json({ error: "Reopen failed" }, { status: 500 });
  }
}
