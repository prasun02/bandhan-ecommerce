"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { getGuestKey, readStoredCart, type StoredCartLine, writeStoredCart } from "@/lib/cart-storage";
import { ProductImage } from "@/components/product-image";

export function CartPageClient() {
  const [lines, setLines] = useState<StoredCartLine[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLines(readStoredCart());
  }, []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [lines]);

  async function setQuantity(line: StoredCartLine, quantity: number) {
    setMessage("");
    const safeQuantity = Math.min(Math.max(1, quantity), line.availableStock);
    const guestKey = getGuestKey();
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestKey, productId: line.productId, variantId: line.variantId, quantity: safeQuantity, mode: "set" })
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setMessage(result.error ?? "Could not update cart.");
      return;
    }
    const next = lines.map((item) => (item.productId === line.productId && item.variantId === line.variantId ? { ...item, quantity: safeQuantity } : item));
    setLines(next);
    writeStoredCart(next);
  }

  function removeLine(line: StoredCartLine) {
    const next = lines.filter((item) => !(item.productId === line.productId && item.variantId === line.variantId));
    setLines(next);
    writeStoredCart(next);
  }

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Cart</h1>
      {message ? <p className="mt-4 rounded-md bg-saffron/15 p-3 text-sm font-semibold">{message}</p> : null}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {lines.length === 0 ? (
            <div className="rounded-md bg-white p-6 text-ink/65 shadow-sm">Your cart is empty.</div>
          ) : (
            lines.map((line) => (
              <article key={`${line.productId}-${line.variantId}`} className="grid gap-4 rounded-md bg-white p-4 shadow-card md:grid-cols-[96px_1fr_180px_120px]">
                <div className="relative aspect-square overflow-hidden rounded-md bg-blush">
                  <ProductImage src={line.image} alt={line.name} fill className="object-cover" />
                </div>
                <div>
                  <h2 className="font-black">{line.name}</h2>
                  <p className="mt-1 text-sm text-ink/60">{line.color} / {line.size} / SKU {line.sku}</p>
                  <p className="mt-2 text-sm">{formatMoney(line.unitPrice)} each. {line.availableStock} available.</p>
                </div>
                <div className="grid grid-cols-[40px_1fr_40px] self-start overflow-hidden rounded-md border border-ink/15">
                  <button aria-label="Decrease quantity" onClick={() => setQuantity(line, line.quantity - 1)} className="grid h-10 place-items-center bg-mist">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input value={line.quantity} onChange={(event) => setQuantity(line, Number(event.target.value))} className="h-10 text-center outline-none" />
                  <button aria-label="Increase quantity" onClick={() => setQuantity(line, line.quantity + 1)} className="grid h-10 place-items-center bg-mist">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-3 md:block md:text-right">
                  <strong className="text-rosewood">{formatMoney(line.unitPrice * line.quantity)}</strong>
                  <button aria-label="Remove item" onClick={() => removeLine(line)} className="mt-0 rounded-md p-2 text-red-600 hover:bg-red-50 md:mt-3">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
        <aside className="h-fit rounded-md bg-white p-5 shadow-card">
          <h2 className="text-xl font-black">Summary</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <input placeholder="Coupon code" className="h-11 rounded-md border border-ink/15 px-3" />
            <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
            <div className="flex justify-between"><span>Delivery</span><strong>Calculated at checkout</strong></div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg"><span>Total</span><strong>{formatMoney(subtotal)}</strong></div>
          </div>
          <Link href="/checkout" className="mt-5 block">
            <Button disabled={lines.length === 0} className="w-full">Proceed to checkout</Button>
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-bold text-rosewood">Continue shopping</Link>
        </aside>
      </div>
    </main>
  );
}
