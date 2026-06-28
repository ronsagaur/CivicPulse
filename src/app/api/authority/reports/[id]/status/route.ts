import { NextResponse } from "next/server";
import { authorityAction, type AuthorityAction } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as AuthorityAction;
  const note = body.note as string | undefined;
  const officerName = (body.officerName as string | undefined) ?? "Officer Sharma";

  if (!["ACKNOWLEDGE", "START", "RESOLVE"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const report = await authorityAction(params.id, action, officerName, note);
  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}
