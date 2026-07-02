import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/security";
import { seedDemoProducts } from "@/lib/services/demo-product-seed";

export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) {
    return NextResponse.json(
      { error: "Administrator authorization required." },
      { status: 403 }
    );
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const summary = await seedDemoProducts(prisma, { adminUserId: admin.id });
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/admin", "layout");
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Demo products could not be seeded safely." },
      { status: 500 }
    );
  }
}
