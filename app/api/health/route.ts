import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "available", timestamp });
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable", timestamp },
      { status: 503 }
    );
  }
}
