import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { requireAdmin } from "@/lib/auth";
import { createCategory } from "@/lib/services/admin-catalog";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const category = await createCategory(await request.json(), actor);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Category creation failed.", error, "Category creation failed.") }, { status: 400 });
  }
}
