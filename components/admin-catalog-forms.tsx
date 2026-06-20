"use client";

import { useState } from "react";

export function AdminCategoryForm() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug") || undefined,
        description: formData.get("description") || undefined,
        imageUrl: formData.get("imageUrl") || undefined,
        isActive: true,
        sortOrder: 0
      })
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setMessage(response.ok ? `Category created: ${result.id}` : result.error ?? "Category creation failed.");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-md bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Create category</h2>
      <input name="name" required placeholder="Category name" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="slug" placeholder="category-slug" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="imageUrl" placeholder="Image URL" className="h-11 rounded-md border border-ink/15 px-3" />
      <textarea name="description" placeholder="Description" className="min-h-24 rounded-md border border-ink/15 p-3" />
      <button className="h-11 rounded-md bg-rosewood font-bold text-white">Create category</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}

export function AdminProductForm({ categories, categoryId }: { categories?: { id: string; name: string }[]; categoryId?: string }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        sku: formData.get("sku"),
        shortDescription: formData.get("shortDescription"),
        description: formData.get("description"),
        categoryId: formData.get("categoryId") || categoryId,
        regularPrice: Number(formData.get("regularPrice")),
        salePrice: formData.get("salePrice") ? Number(formData.get("salePrice")) : undefined,
        stockQuantity: Number(formData.get("stockQuantity")),
        featuredImageUrl: formData.get("imageUrl"),
        images: [{ url: String(formData.get("imageUrl")), altText: String(formData.get("name")) }],
        variants: [
          {
            sku: `${String(formData.get("sku"))}-M-RED`,
            size: "M",
            color: "Red",
            stockQuantity: Number(formData.get("variantStock")),
            priceAdjustment: 0,
            imageUrl: String(formData.get("imageUrl"))
          },
          {
            sku: `${String(formData.get("sku"))}-L-BLUE`,
            size: "L",
            color: "Blue",
            stockQuantity: Number(formData.get("variantStock")),
            priceAdjustment: 15000,
            imageUrl: String(formData.get("imageUrl"))
          }
        ],
        status: "PUBLISHED",
        tags: ["admin-created"]
      })
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setMessage(response.ok ? `Product created: ${result.id}` : result.error ?? "Product creation failed.");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-md bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Create product with variants</h2>
      {categories?.length ? (
        <select name="categoryId" defaultValue={categoryId} required className="h-11 rounded-md border border-ink/15 px-3">
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      ) : (
        <input name="categoryId" defaultValue={categoryId} required placeholder="Category ID" className="h-11 rounded-md border border-ink/15 px-3" />
      )}
      <input name="name" required placeholder="Product name" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="sku" required placeholder="SKU" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="shortDescription" required placeholder="Short description" className="h-11 rounded-md border border-ink/15 px-3" />
      <textarea name="description" required placeholder="Full description" className="min-h-24 rounded-md border border-ink/15 p-3" />
      <input name="regularPrice" required type="number" placeholder="Regular price in paisa" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="salePrice" type="number" placeholder="Sale price in paisa" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="stockQuantity" required type="number" placeholder="Base stock" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="variantStock" required type="number" placeholder="Variant stock" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="imageUrl" required type="url" placeholder="Image URL" className="h-11 rounded-md border border-ink/15 px-3" />
      <button className="h-11 rounded-md bg-rosewood font-bold text-white">Create product</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}
