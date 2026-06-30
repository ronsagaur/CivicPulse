import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/store";

export async function POST(req: NextRequest) {
  // ── 1. Parse request body safely ──────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const mode = typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "";

  // ── 2. Instant Demo Entry ─────────────────────────────────────
  // Logs in as the seeded demo user "You" (u-you) with pre-populated
  // reports, verifications, and trust history.
  if (mode === "demo") {
    try {
      // Try to find the seeded demo user
      let demoUser = await prisma.user.findUnique({ where: { id: "u-you" } });

      if (!demoUser) {
        // Fallback: find by known seed phone, or create a demo user
        demoUser = await prisma.user.findUnique({ where: { phone: "+919876543210" } });
      }

      if (!demoUser) {
        // Create a fresh demo user if seed data was cleared
        demoUser = await prisma.user.create({
          data: {
            id: "u-you",
            phone: "+919876543210",
            name: "Demo Citizen",
            homeLat: 19.1197,
            homeLng: 72.8468,
            trustScore: 50,
            band: "Citizen",
          },
        });
      }

      const res = NextResponse.json({
        success: true,
        redirect: "/",
        user: { name: demoUser.name, id: demoUser.id },
      });
      res.cookies.set("civicpulse_session", demoUser.id, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return res;
    } catch (err) {
      console.error("[Login] Demo login error:", err);
      return NextResponse.json(
        { success: false, error: "Could not start demo session. Try resetting the database." },
        { status: 500 }
      );
    }
  }

  // ── 3. Credentials Login ──────────────────────────────────────
  // Sign in with name + phone. Creates the user if they don't exist.
  if (mode === "credentials") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const homeLat = typeof body.homeLat === "number" ? body.homeLat : null;
    const homeLng = typeof body.homeLng === "number" ? body.homeLng : null;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    if (homeLat === null || homeLng === null || !isFinite(homeLat) || !isFinite(homeLng)) {
      return NextResponse.json(
        { success: false, error: "Valid location coordinates are required." },
        { status: 400 }
      );
    }

    try {
      let user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            name,
            homeLat,
            homeLng,
            trustScore: 10,
            band: "Citizen",
          },
        });
      } else {
        // Update name and location if they changed
        const needsUpdate =
          user.name !== name ||
          user.homeLat !== homeLat ||
          user.homeLng !== homeLng;

        if (needsUpdate) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name, homeLat, homeLng },
          });
        }
      }

      const res = NextResponse.json({
        success: true,
        redirect: "/",
        user: { name: user.name, id: user.id },
      });
      res.cookies.set("civicpulse_session", user.id, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      return res;
    } catch (err: unknown) {
      // Handle Prisma unique constraint violation (race condition)
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        try {
          const existing = await prisma.user.findUnique({ where: { phone } });
          if (existing) {
            const res = NextResponse.json({
              success: true,
              redirect: "/",
              user: { name: existing.name, id: existing.id },
            });
            res.cookies.set("civicpulse_session", existing.id, {
              httpOnly: true,
              secure: false,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
            return res;
          }
        } catch {
          // Fall through to generic error
        }
      }

      console.error("[Login] Database error:", err);
      return NextResponse.json(
        { success: false, error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── 4. Unknown mode ───────────────────────────────────────────
  return NextResponse.json(
    { success: false, error: "Invalid login mode. Use 'demo' or 'credentials'." },
    { status: 400 }
  );
}
