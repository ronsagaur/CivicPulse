import { NextResponse } from "next/server";
import { verifyReport } from "@/lib/store";
import type { Verdict } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const verdict = (body.verdict ?? "CONFIRM") as Verdict;
    const verifierId = body.verifierId as string | undefined;

    const report = await verifyReport(params.id, verifierId ?? "u-you", verdict);
    if (!report) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`[POST /api/reports/${params.id}/verify] Error:`, err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
