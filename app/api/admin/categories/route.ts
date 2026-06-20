import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCategory } from "@/lib/services/admin-catalog";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const category = await createCategory(await request.json(), actor);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Category creation failed." }, { status: 400 });
  }
}
