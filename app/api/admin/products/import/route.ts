import { NextResponse } from "next/server";
import { publicApiErrorMessage } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { importDemoProducts, parseProductImportCsv, validateUploadFile } from "@/lib/services/product-import";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    validateUploadFile(file);
    const csvText = await file.text();
    const previewOnly = new URL(request.url).searchParams.get("preview") === "true";

    if (previewOnly) {
      const parsed = parseProductImportCsv(csvText);
      return NextResponse.json({
        rowsRead: parsed.rowsRead,
        preview: parsed.rows.slice(0, 10).map((row) => ({
          rowNumber: row.rowNumber,
          sku: row.sku,
          name: row.name,
          category: row.category,
          regularPrice: row.regularPrice,
          stock: row.stock,
          status: row.status
        })),
        validationErrors: parsed.validationErrors,
        warnings: parsed.warnings
      });
    }

    const summary = await importDemoProducts(prisma, { csvText, projectRoot: process.cwd() });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: publicApiErrorMessage("CSV product import failed.", error, "CSV import failed.") }, { status: 400 });
  }
}
