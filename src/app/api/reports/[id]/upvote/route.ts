import { NextResponse } from "next/server";
import { upvoteReport } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await upvoteReport(params.id);
    if (!report) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[POST /api/reports/${params.id}/upvote] Error:`, err);
    return NextResponse.json({ error: "Upvote failed" }, { status: 500 });
  }
}
