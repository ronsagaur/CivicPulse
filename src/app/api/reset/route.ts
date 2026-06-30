import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await resetStore();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/reset] Error:", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
