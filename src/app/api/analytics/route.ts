import { NextResponse } from "next/server";
import { computeAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await computeAnalytics();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/analytics] Error:", err);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}
