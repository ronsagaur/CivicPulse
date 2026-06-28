import { NextResponse } from "next/server";
import { computeAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await computeAnalytics();
  return NextResponse.json(data);
}
