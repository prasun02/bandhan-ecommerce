"use client";

import { useState } from "react";

type ImportError = {
  rowNumber: number;
  field: string;
  message: string;
};

type PreviewRow = {
  rowNumber: number;
  sku: string;
  name: string;
  category: string;
  regularPrice: number;
  stock: number;
  status: string;
};

type PreviewResult = {
  rowsRead: number;
  preview: PreviewRow[];
  validationErrors: ImportError[];
  warnings: ImportError[];
  error?: string;
};

type ImportSummary = {
  rowsRead: number;
  validRows: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  categoriesCreated: string[];
  collectionsCreated: string[];
  brandsCreated: string[];
  variantsCreated: number;
  variantsUpdated: number;
  imagesCreated: number;
  imagesSkipped: number;
  validationErrors: ImportError[];
  warnings: ImportError[];
  error?: string;
};

function formatPaisa(amount: number) {
  return `৳${(amount / 100).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export function AdminProductImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [message, setMessage] = useState("");

  async function submit(previewOnly: boolean) {
    setMessage("");
    setSummary(null);
    if (!file) {
      setMessage("Choose a CSV file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setPending(true);
    try {
      const response = await fetch(`/api/admin/products/import${previewOnly ? "?preview=true" : ""}`, {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as PreviewResult | ImportSummary;
      if (!response.ok || result.error) {
        setMessage(result.error ?? "CSV import failed.");
        return;
      }
      if (previewOnly) {
        setPreview(result as PreviewResult);
      } else {
        setSummary(result as ImportSummary);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-6 grid gap-4 rounded-md bg-white p-5 shadow-card">
      <h2 className="text-xl font-black">CSV product import</h2>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="h-11 rounded-md border border-ink/15 px-3 py-2"
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => submit(true)} className="h-11 rounded-md border border-rosewood px-4 font-bold text-rosewood">
          {pending ? "Working..." : "Preview first 10 rows"}
        </button>
        <button type="button" disabled={pending || !preview || preview.validationErrors.length > 0} onClick={() => submit(false)} className="h-11 rounded-md bg-rosewood px-4 font-bold text-white disabled:opacity-50">
          Confirm import
        </button>
      </div>
      {message ? <p className="text-sm font-semibold text-rosewood">{message}</p> : null}
      {preview ? (
        <div className="overflow-x-auto">
          <p className="mb-2 text-sm font-semibold">{preview.rowsRead} rows found</p>
          <table className="w-full text-left text-xs">
            <thead className="bg-mist"><tr><th className="p-2">Row</th><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
            <tbody>
              {preview.preview.map((row) => (
                <tr key={`${row.rowNumber}-${row.sku}`} className="border-t border-ink/10">
                  <td className="p-2">{row.rowNumber}</td>
                  <td>{row.sku}</td>
                  <td>{row.name}</td>
                  <td>{row.category}</td>
                  <td>{formatPaisa(row.regularPrice)}</td>
                  <td>{row.stock}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.validationErrors.length ? <ErrorList title="Validation errors" items={preview.validationErrors} /> : null}
          {preview.warnings.length ? <ErrorList title="Warnings" items={preview.warnings} /> : null}
        </div>
      ) : null}
      {summary ? (
        <div className="grid gap-2 text-sm">
          <p className="font-bold">Import complete</p>
          <p>Rows read: {summary.rowsRead}</p>
          <p>Products created: {summary.productsCreated}</p>
          <p>Products updated: {summary.productsUpdated}</p>
          <p>Variants created: {summary.variantsCreated}</p>
          <p>Images created: {summary.imagesCreated}</p>
          {summary.validationErrors.length ? <ErrorList title="Validation errors" items={summary.validationErrors} /> : null}
          {summary.warnings.length ? <ErrorList title="Warnings" items={summary.warnings} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function ErrorList({ title, items }: { title: string; items: ImportError[] }) {
  return (
    <div className="grid gap-1 rounded-md bg-mist p-3 text-xs">
      <p className="font-bold">{title}</p>
      {items.map((item) => (
        <p key={`${item.rowNumber}-${item.field}-${item.message}`}>Row {item.rowNumber} {item.field}: {item.message}</p>
      ))}
    </div>
  );
}

