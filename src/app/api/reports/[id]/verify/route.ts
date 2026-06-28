import { NextResponse } from "next/server";
import { verifyReport } from "@/lib/store";
import type { Verdict } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const verdict = (body.verdict ?? "CONFIRM") as Verdict;
  const verifierId = body.verifierId as string | undefined;

  const report = await verifyReport(params.id, verifierId ?? "u-you", verdict);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}
