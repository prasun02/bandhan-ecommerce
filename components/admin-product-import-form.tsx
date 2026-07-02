"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_MAX_BYTES,
  PRODUCT_IMPORT_PRICE_UNIT,
  PRODUCT_IMPORT_REQUIRED_HEADERS,
  PRODUCT_IMPORT_SAMPLE_ROW,
  PRODUCT_STATUS_ALIASES,
  PRODUCT_STATUS_VALUES
} from "@/lib/product-import-config";

type ImportIssue = {
  rowNumber: number;
  productKey?: string;
  sku?: string;
  field: string;
  value?: string;
  message: string;
};

type DryRunResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  productsDetected: number;
  variantsDetected: number;
  newProducts: number;
  existingProductsToUpdate: number;
  newVariants: number;
  existingVariantsToUpdate: number;
  categoriesToCreate: number;
  rowsSkipped: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  canImport: boolean;
  error?: string;
};

type ImportSummary = {
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  categoriesCreated: number;
  rowsSkipped: number;
  warningCount: number;
  durationMs: number;
  error?: string;
};

const maxMegabytes = PRODUCT_IMPORT_MAX_BYTES / 1024 / 1024;
const sampleRow = PRODUCT_IMPORT_HEADERS
  .map((header) => PRODUCT_IMPORT_SAMPLE_ROW[header])
  .join(",");

export function AdminProductImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "validating" | "importing">("idle");
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [message, setMessage] = useState("");

  function chooseFile(nextFile: File | null) {
    setDryRun(null);
    setSummary(null);
    setMessage("");
    if (!nextFile) {
      setFile(null);
      return;
    }
    const extension = nextFile.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx"].includes(extension ?? "")) {
      setFile(null);
      setMessage("Only CSV and XLSX files are supported.");
      return;
    }
    if (nextFile.size > PRODUCT_IMPORT_MAX_BYTES) {
      setFile(null);
      setMessage(`The upload must be ${maxMegabytes} MB or smaller.`);
      return;
    }
    setFile(nextFile);
  }

  async function submit(dryRunOnly: boolean) {
    if (!file || state !== "idle") return;
    setMessage("");
    if (dryRunOnly) {
      setSummary(null);
      setState("validating");
    } else {
      setState("importing");
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `/api/admin/products/import${dryRunOnly ? "?dryRun=true" : ""}`,
        {
          method: "POST",
          credentials: "include",
          body: formData
        }
      );
      const result = await response.json() as DryRunResult | ImportSummary;
      if (dryRunOnly) {
        const validation = result as DryRunResult;
        setDryRun(validation);
        if (!response.ok && !validation.errors) {
          setMessage(validation.error ?? "Validation failed.");
        }
      } else if (!response.ok || result.error) {
        const failed = result as DryRunResult;
        if (failed.errors) setDryRun(failed);
        setMessage(result.error ?? "Import was not completed.");
      } else {
        setSummary(result as ImportSummary);
        setDryRun(null);
      }
    } catch {
      setMessage("The import request could not be completed. Please try again.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section className="mt-6 grid gap-5">
      <div
        className="grid min-h-48 place-items-center rounded-lg border-2 border-dashed border-rosewood/30 bg-white p-6 text-center shadow-sm"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div>
          <h2 className="text-xl font-black">CSV or XLSX product import</h2>
          <p className="mt-2 text-sm text-ink/60">
            Drop one file here, or choose a file. Maximum size: {maxMegabytes} MB.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-md border border-rosewood px-4 py-2 text-sm font-bold text-rosewood"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
          {file ? (
            <p className="mt-3 text-sm font-semibold">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/products/import"
          download
          className="rounded-md border border-ink/20 bg-white px-4 py-2 text-sm font-bold"
        >
          Download CSV Template
        </a>
        <button
          type="button"
          disabled={!file || state !== "idle"}
          onClick={() => submit(true)}
          className="rounded-md border border-rosewood px-4 py-2 text-sm font-bold text-rosewood disabled:opacity-50"
        >
          {state === "validating" ? "Validating complete file..." : "Dry Run / Validate"}
        </button>
        <button
          type="button"
          disabled={!file || state !== "idle" || !dryRun?.canImport}
          onClick={() => submit(false)}
          className="rounded-md bg-rosewood px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {state === "importing" ? "Importing in one transaction..." : "Import Products"}
        </button>
      </div>

      <div className="grid gap-3 rounded-lg bg-white p-5 text-sm shadow-sm">
        <h2 className="text-lg font-black">Import format help</h2>
        <div>
          <p className="font-bold">Required headers</p>
          <p className="mt-1 break-words text-ink/70">
            {PRODUCT_IMPORT_REQUIRED_HEADERS.join(", ")}
          </p>
        </div>
        <div>
          <p className="font-bold">Accepted product statuses</p>
          <p className="mt-1 text-ink/70">
            Database values: {PRODUCT_STATUS_VALUES.join(", ")}.
          </p>
          {PRODUCT_STATUS_VALUES.map((status) => (
            <p key={status} className="text-ink/70">
              {status}: {PRODUCT_STATUS_ALIASES[status].join(", ")}
            </p>
          ))}
        </div>
        <p><strong>Price unit:</strong> {PRODUCT_IMPORT_PRICE_UNIT}; values are converted to poisha when saved.</p>
        <p><strong>Maximum file size:</strong> {maxMegabytes} MB</p>
        <div>
          <p className="font-bold">Exact header row</p>
          <code className="mt-1 block overflow-x-auto rounded bg-mist p-2 text-xs">
            {PRODUCT_IMPORT_HEADERS.join(",")}
          </code>
        </div>
        <div>
          <p className="font-bold">Example row</p>
          <code className="mt-1 block overflow-x-auto rounded bg-mist p-2 text-xs">
            {sampleRow}
          </code>
        </div>
      </div>

      {message ? (
        <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      {dryRun ? <DryRunPanel result={dryRun} /> : null}
      {summary ? <ImportResult summary={summary} onReset={() => {
        setFile(null);
        setSummary(null);
        if (inputRef.current) inputRef.current.value = "";
      }} /> : null}
    </section>
  );
}

function DryRunPanel({ result }: { result: DryRunResult }) {
  const cards = [
    ["Total rows", result.totalRows],
    ["Valid rows", result.validRows],
    ["Invalid rows", result.invalidRows],
    ["Products detected", result.productsDetected],
    ["Variants detected", result.variantsDetected],
    ["New products", result.newProducts],
    ["Products to update", result.existingProductsToUpdate],
    ["New variants", result.newVariants],
    ["Variants to update", result.existingVariantsToUpdate],
    ["Categories to create", result.categoriesToCreate],
    ["Rows skipped", result.rowsSkipped]
  ];
  return (
    <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">Dry-run results</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          result.canImport ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {result.canImport ? "Ready to import" : "Fix validation errors"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-md bg-mist p-3">
            <p className="text-xs text-ink/60">{label}</p>
            <p className="mt-1 text-xl font-black">{value}</p>
          </div>
        ))}
      </div>
      {result.errors.length ? <IssueList title="Validation errors" items={result.errors} /> : null}
      {result.warnings.length ? <IssueList title="Warnings" items={result.warnings} /> : null}
    </div>
  );
}

function ImportResult({
  summary,
  onReset
}: {
  summary: ImportSummary;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-lg bg-green-50 p-5 text-sm">
      <h2 className="text-xl font-black text-green-900">Import complete</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <p>Products created: <strong>{summary.productsCreated}</strong></p>
        <p>Products updated: <strong>{summary.productsUpdated}</strong></p>
        <p>Variants created: <strong>{summary.variantsCreated}</strong></p>
        <p>Variants updated: <strong>{summary.variantsUpdated}</strong></p>
        <p>Categories created: <strong>{summary.categoriesCreated}</strong></p>
        <p>Rows skipped: <strong>{summary.rowsSkipped}</strong></p>
        <p>Warnings: <strong>{summary.warningCount}</strong></p>
        <p>Duration: <strong>{summary.durationMs} ms</strong></p>
      </div>
      <div className="flex flex-wrap gap-3 font-bold text-rosewood">
        <Link href="/admin/products">View products</Link>
        <button type="button" onClick={onReset}>Import another file</button>
        <Link href="/admin">Administrator dashboard</Link>
      </div>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: ImportIssue[] }) {
  return (
    <div className="grid gap-2 rounded-md bg-mist p-3 text-xs">
      <p className="font-bold">{title}</p>
      {items.map((item, index) => (
        <p key={`${item.rowNumber}-${item.field}-${index}`}>
          Row {item.rowNumber}
          {item.productKey ? ` · ${item.productKey}` : ""}
          {item.sku ? ` · ${item.sku}` : ""}
          {` · ${item.field}: ${item.message}`}
          {item.value ? ` (value: ${item.value})` : ""}
        </p>
      ))}
    </div>
  );
}
