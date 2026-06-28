import { NextResponse } from "next/server";
import { prisma } from "@/lib/store";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { role, name, phone, homeLat, homeLng } = await req.json();

    if (role === "AUTHORITY") {
      cookies().set("civicpulse_session", "AUTHORITY_SESSION", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return NextResponse.json({ success: true, redirect: "/authority" });
    }

    if (role === "CITIZEN") {
      if (!name || !phone || homeLat == null || homeLng == null) {
        return NextResponse.json(
          { error: "Missing required fields for Citizen login" },
          { status: 400 }
        );
      }

      let user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            name,
            homeLat,
            homeLng,
            trustScore: 50,
            band: "New",
          },
        });
      } else if (user.homeLat !== homeLat || user.homeLng !== homeLng) {
        // Update their location if it has changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: { homeLat, homeLng },
        });
      }

      cookies().set("civicpulse_session", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return NextResponse.json({ success: true, redirect: "/" });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
