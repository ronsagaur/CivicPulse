import { NextResponse } from "next/server";
import {
  applyClassification,
  createReport,
  listReports,
} from "@/lib/store";
import type { AiMetadata, ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category") ?? undefined;
  const wardId = searchParams.get("wardId") ?? undefined;

  const reports = await listReports({
    status: status ? (status.split(",") as ReportStatus[]) : undefined,
    category: category || undefined,
    wardId: wardId || undefined,
  });
  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    lat,
    lng,
    description,
    isAnonymous,
    reporterId,
    addressText,
    wardId,
    ai,
    titleOverride,
    descriptionOverride,
    mediaType,
    mediaUrl,
  } = body as {
    lat: number;
    lng: number;
    description?: string;
    isAnonymous?: boolean;
    reporterId?: string;
    addressText?: string;
    wardId?: string;
    ai?: AiMetadata;
    titleOverride?: string;
    descriptionOverride?: string;
    mediaType?: "image" | "video";
    mediaUrl?: string;
  };

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const report = await createReport({
    lat,
    lng,
    description: descriptionOverride ?? description,
    isAnonymous,
    reporterId,
    addressText,
    wardId,
    mediaType,
    mediaUrl,
  });

  // If the client already ran the preview classifier, apply it now so the
  // report lands directly in PENDING_VERIFICATION (with user edits respected).
  if (ai) {
    await applyClassification(report.id, {
      ...ai,
      suggested_title: titleOverride ?? ai.suggested_title,
      suggested_description:
        descriptionOverride ?? ai.suggested_description,
    });
  }

  // Fetch updated report containing applied events & classification
  const updatedReport = await listReports({ status: undefined }).then(list =>
    list.find(r => r.id === report.id)
  );

  return NextResponse.json({ report: updatedReport || report }, { status: 201 });
}
