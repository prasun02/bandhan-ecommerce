import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  importProducts,
  parseProductImportFile,
  prepareProductImport,
  ProductImportValidationError,
  recordFailedProductImport
} from "@/lib/services/admin-product-import";

export async function POST(request: Request) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) {
    return NextResponse.json({ error: "Administrator authorization required." }, { status: 403 });
  }

  let fileName = "unknown";
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A CSV or XLSX file is required." }, { status: 400 });
    }

    fileName = file.name;
    const parsed = await parseProductImportFile(file);
    const dryRunOnly = new URL(request.url).searchParams.get("dryRun") === "true";
    const plan = await prepareProductImport(prisma, parsed);

    if (dryRunOnly) {
      return NextResponse.json(plan.dryRun, {
        status: plan.dryRun.canImport ? 200 : 422
      });
    }

    if (!plan.dryRun.canImport) {
      await recordFailedProductImport(prisma, {
        adminUserId: admin.id,
        fileName,
        reason: "VALIDATION_FAILED",
        errorCount: plan.dryRun.errors.length
      }).catch(() => undefined);
      return NextResponse.json(plan.dryRun, { status: 422 });
    }

    const summary = await importProducts(prisma, {
      adminUserId: admin.id,
      fileName,
      parsed
    });
    return NextResponse.json(summary);
  } catch (error) {
    const validation =
      error instanceof ProductImportValidationError ? error.dryRun : null;
    await recordFailedProductImport(prisma, {
      adminUserId: admin.id,
      fileName,
      reason: validation ? "VALIDATION_FAILED" : "IMPORT_FAILED",
      errorCount: validation?.errors.length
    }).catch(() => undefined);
    if (validation) return NextResponse.json(validation, { status: 422 });
    const message =
      error instanceof Error &&
      [
        "The selected file is empty.",
        "The upload must be 10 MB or smaller.",
        "Only CSV and XLSX files are supported."
      ].includes(error.message)
        ? error.message
        : "Product import failed safely. No partial import was committed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
