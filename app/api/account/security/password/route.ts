import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordSiteEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/security";
import { passwordChangeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid password." }, { status: 400 });
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true, email: true } });
  if (!record?.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });
  await recordSiteEvent("CUSTOMER_PASSWORD_CHANGED", { userId: user.id, entityType: "User", entityId: user.id });
  return NextResponse.json({ ok: true, email: record.email });
}
