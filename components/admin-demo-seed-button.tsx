"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SeedSummary = {
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
} | { error: string };

export function AdminDemoSeedButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<SeedSummary | null>(null);

  async function seed() {
    if (
      pending ||
      !window.confirm(
        "Add Demo Products creates or updates eight demo products and their variants. It does not delete existing data. Continue?"
      )
    ) {
      return;
    }

    setPending(true);
    setSummary(null);
    try {
      const response = await fetch("/api/admin/products/demo-seed", {
        method: "POST",
        credentials: "include"
      });
      const result = await response.json() as SeedSummary;
      setSummary(result);
      if (response.ok) router.refresh();
    } catch {
      setSummary({ error: "The demo seed request could not be completed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={seed}
        className="rounded-md border border-rosewood bg-white px-4 py-2 text-sm font-bold text-rosewood disabled:opacity-60"
      >
        {pending ? "Adding Demo Products..." : "Add Demo Products"}
      </button>
      {summary && "error" in summary ? (
        <span className="text-sm font-semibold text-red-700">{summary.error}</span>
      ) : summary ? (
        <span className="text-sm text-ink/70">
          Products: {summary.productsCreated} created, {summary.productsUpdated} updated.
          Variants: {summary.variantsCreated} created, {summary.variantsUpdated} updated.
        </span>
      ) : null}
    </div>
  );
}
