import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordSiteEvent } from "@/lib/events";
import { hasSameOrigin } from "@/lib/security";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { registrationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const attempt = rateLimit(`register:${requestIp(request)}`, 5, 15 * 60_000);
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(attempt.retryAfter) } }
    );
  }

  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        role: "CUSTOMER",
        isActive: true,
        profile: {
          create: { fullName: parsed.data.name, phone: parsed.data.phone }
        }
      },
      select: { id: true }
    });
    await recordSiteEvent("CUSTOMER_REGISTERED", { userId: user.id, entityType: "User", entityId: user.id });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "An account already exists with this email or phone number." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
  }
}
