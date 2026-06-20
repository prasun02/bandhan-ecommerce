"use client";

import { useState } from "react";

export function AdminProductEditForm({ products }: { products: { id: string; name: string }[] }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: formData.get("productId"),
        regularPrice: formData.get("regularPrice") ? Number(formData.get("regularPrice")) : undefined,
        salePrice: formData.get("salePrice") ? Number(formData.get("salePrice")) : undefined,
        stockQuantity: formData.get("stockQuantity") ? Number(formData.get("stockQuantity")) : undefined,
        status: formData.get("status") || undefined
      })
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setMessage(response.ok ? `Updated product ${result.id}` : result.error ?? "Product update failed.");
  }

  return (
    <form action={submit} className="mt-5 grid gap-3 rounded-md bg-white p-5 shadow-card">
      <h2 className="text-xl font-black">Quick edit product</h2>
      <select name="productId" required className="h-11 rounded-md border border-ink/15 px-3">
        <option value="">Select product</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="regularPrice" type="number" placeholder="Regular price" className="h-11 rounded-md border border-ink/15 px-3" />
        <input name="salePrice" type="number" placeholder="Sale price" className="h-11 rounded-md border border-ink/15 px-3" />
        <input name="stockQuantity" type="number" placeholder="Stock" className="h-11 rounded-md border border-ink/15 px-3" />
      </div>
      <select name="status" className="h-11 rounded-md border border-ink/15 px-3">
        <option value="">Leave status unchanged</option>
        {["DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}
      </select>
      <button className="h-11 rounded-md bg-rosewood font-bold text-white">Save product changes</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}
