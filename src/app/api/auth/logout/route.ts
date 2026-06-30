import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, redirect: "/login" });
  res.cookies.set("civicpulse_session", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });
  return res;
}
