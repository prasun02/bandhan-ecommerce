import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordSiteEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/security";
import { profileUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = profileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile." }, { status: 400 });
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        profile: {
          upsert: {
            create: { fullName: parsed.data.name, phone: parsed.data.phone },
            update: { fullName: parsed.data.name, phone: parsed.data.phone }
          }
        }
      }
    });
    await recordSiteEvent("CUSTOMER_PROFILE_UPDATED", { userId: user.id, entityType: "User", entityId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That phone number is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
  }
}
