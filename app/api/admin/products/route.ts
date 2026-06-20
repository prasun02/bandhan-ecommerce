import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createProduct, updateProduct } from "@/lib/services/admin-catalog";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const product = await createProduct(await request.json(), actor);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Product creation failed." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    const product = await updateProduct(await request.json(), actor);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Product update failed." }, { status: 400 });
  }
}
