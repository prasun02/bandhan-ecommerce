import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { requireAdmin } from "@/lib/auth";
import { createProduct, updateProduct } from "@/lib/services/admin-catalog";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const product = await createProduct(await request.json(), actor);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Product creation failed.", error, "Product creation failed.") }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin();
    const product = await updateProduct(await request.json(), actor);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("Product update failed.", error, "Product update failed.") }, { status: 400 });
  }
}
