import { NextResponse } from "next/server";
import {
  applyClassification,
  createReport,
  listReports,
  prisma,
  getCurrentUser,
} from "@/lib/store";
import { detectDuplicateReport } from "@/lib/ai";
import type { AiMetadata, ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
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
  } catch (err) {
    console.error("[GET /api/reports] Error:", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    // Autonomous Duplicate Detection Agent
    const existingOpenReports = await listReports({
      status: ["PENDING_VERIFICATION", "VERIFIED", "ROUTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED_PENDING_CONFIRM", "ESCALATED"],
      wardId: wardId || undefined,
    });

    const categoryToCheck = ai?.category || "OTHER";
    const duplicateCheck = await detectDuplicateReport(
      {
        title: titleOverride || ai?.suggested_title || "Civic report",
        description: descriptionOverride || description || "",
        category: categoryToCheck,
        lat,
        lng,
      },
      existingOpenReports
    );

    if (duplicateCheck.isDuplicate && duplicateCheck.duplicateReportId) {
      const dupId = duplicateCheck.duplicateReportId;
      const existing = await prisma.report.findUnique({ where: { id: dupId } });
      if (existing) {
        const reporter = await getCurrentUser();
        await prisma.report.update({
          where: { id: dupId },
          data: {
            upvoteCount: existing.upvoteCount + 1,
            duplicateCount: existing.duplicateCount + 1,
          },
        });

        await prisma.reportEvent.create({
          data: {
            reportId: dupId,
            type: "MERGED",
            actorType: "SYSTEM",
            label: `Agent merged duplicate claim by ${reporter.name}. Action: Upvote and merge incremented. ${duplicateCheck.reason}`,
            at: new Date(),
          },
        });

        const updatedExisting = await listReports({ status: undefined }).then((list) =>
          list.find((r) => r.id === dupId)
        );

        return NextResponse.json({
          isDuplicate: true,
          duplicateReportId: dupId,
          reason: duplicateCheck.reason,
          report: updatedExisting,
        }, { status: 200 });
      }
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
  } catch (err) {
    console.error("[POST /api/reports] Error:", err);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
