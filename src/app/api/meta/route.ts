import { NextResponse } from "next/server";
import { getCurrentUserOrNull, getDepartments, getUsers, getWards } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      wards: await getWards(),
      departments: await getDepartments(),
      users: await getUsers(),
      currentUser: await getCurrentUserOrNull(),
    });
  } catch (err) {
    console.error("[GET /api/meta] Error:", err);
    return NextResponse.json({ error: "Failed to load metadata" }, { status: 500 });
  }
}
