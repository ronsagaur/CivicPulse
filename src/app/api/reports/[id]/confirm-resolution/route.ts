import { NextResponse } from "next/server";
import { confirmResolution } from "@/lib/store";
import type { ResolutionVerdict } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const verdict = (body.verdict ?? "FIXED") as ResolutionVerdict;
  const confirmerId = (body.confirmerId as string | undefined) ?? "u-you";

  const report = await confirmResolution(params.id, confirmerId, verdict);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}
