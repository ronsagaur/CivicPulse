import { NextResponse } from "next/server";
import { getCurrentUserOrNull, getDepartments, getUsers, getWards } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    wards: await getWards(),
    departments: await getDepartments(),
    users: await getUsers(),
    currentUser: await getCurrentUserOrNull(),
  });
}
