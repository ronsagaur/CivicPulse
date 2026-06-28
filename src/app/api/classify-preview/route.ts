import { NextResponse } from "next/server";
import { classify } from "@/lib/ai";
import type { IssueCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

// Stateless: runs the classifier for the report-flow preview, WITHOUT
// persisting anything. The report is only created on final submit.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ai = await classify({
    imageBase64: body.imageBase64,
    mediaType: body.mediaType,
    description: body.description,
    categoryHint: body.categoryHint as IssueCategory | undefined,
  });
  return NextResponse.json({ ai });
}
