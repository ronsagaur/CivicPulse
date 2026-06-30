import { NextResponse } from "next/server";
import { prisma, listReports, escalateTicket } from "@/lib/store";
import { chooseEscalationToolCall } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const now = new Date();
    
    // Find all active reports with breached SLAs
    const overdueReports = await listReports({
      status: ["ROUTED", "ACKNOWLEDGED", "IN_PROGRESS"],
      wardId: undefined
    }).then((reports) =>
      reports.filter(
        (r) => r.slaDeadline && new Date(r.slaDeadline) < now
      )
    );

    const results = [];

    for (const report of overdueReports) {
      const delayMs = now.getTime() - new Date(report.slaDeadline!).getTime();
      const delayHours = Math.round(delayMs / 3600000);
      const reason = `SLA deadline breached by ${delayHours}h. Ticket is stalled in ${report.status} status.`;

      // Call Gemini Escalation Agent to decide action
      const toolCall = await chooseEscalationToolCall(report, reason);

      if (toolCall.name === "escalateTicket") {
        const escalationReason = String(
          toolCall.args.reason || `SLA breach escalation by AI Watchdog Agent: ${reason}`
        );

        // Execute the autonomous escalation
        await escalateTicket(report.id, escalationReason);

        results.push({
          reportId: report.id,
          title: report.title,
          status: "ESCALATED",
          delayHours,
          reason: escalationReason,
          actionTaken: "Escalated to next department level"
        });
      } else {
        results.push({
          reportId: report.id,
          title: report.title,
          status: "MONITORED",
          delayHours,
          reason: "Agent recommended monitoring without re-routing.",
          actionTaken: "Monitored"
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: overdueReports.length,
      escalated: results.filter(r => r.status === "ESCALATED").length,
      actions: results
    });

  } catch (err: any) {
    console.error("[CivicPulse SLA Watchdog Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
