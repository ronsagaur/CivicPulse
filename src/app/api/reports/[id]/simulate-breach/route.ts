import { NextResponse } from "next/server";
import { escalateTicket, prisma } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const r = await prisma.report.findUnique({ where: { id: params.id } });
  if (!r) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.report.update({
    where: { id: params.id },
    data: {
      slaDeadline: new Date(Date.now() - 3600 * 1000),
    },
  });

  await escalateTicket(
    params.id,
    "SLA breached; automatic escalation threshold crossed"
  );

  return NextResponse.json({ success: true });
}
