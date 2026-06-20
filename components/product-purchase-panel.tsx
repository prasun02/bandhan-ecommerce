"use client";

import { useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/catalog";
import { formatMoney } from "@/lib/utils";
import { getGuestKey, readStoredCart, writeStoredCart } from "@/lib/cart-storage";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const colors = [...new Set(product.variants.map((variant) => variant.color).filter(Boolean))] as string[];
  const sizes = [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))] as string[];
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => (!color || variant.color === color) && (!size || variant.size === size)),
    [color, product.variants, size]
  );
  const availableStock = selectedVariant?.stock ?? product.stock;
  const unitPrice = (product.salePrice ?? product.regularPrice) + (selectedVariant?.priceAdjustment ?? 0);
  const total = unitPrice * quantity;

  function setSafeQuantity(next: number) {
    setQuantity(Math.min(Math.max(1, next), availableStock));
  }

  async function addToCart(buyNow = false) {
    if (pending) return;
    setMessage("");
    if (colors.length > 0 && !color) {
      setMessage("Please select a color.");
      return;
    }
    if (sizes.length > 0 && !size) {
      setMessage("Please select a size.");
      return;
    }
    if (product.variants.length > 0 && (!selectedVariant || !selectedVariant.id)) {
      setMessage("This combination is unavailable.");
      return;
    }
    setPending(true);
    try {
      const guestKey = getGuestKey();
      const payload = { guestKey, productId: product.id, variantId: selectedVariant?.id, quantity, mode: "increment" };
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setMessage(result.error ?? "Could not add to cart.");
        return;
      }
      const cart = readStoredCart();
      const existing = cart.find((line) => line.productId === product.id && line.variantId === selectedVariant?.id);
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, availableStock);
      const next = cart.filter((line) => !(line.productId === product.id && line.variantId === selectedVariant?.id));
      next.push({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity: nextQuantity,
        name: product.name,
        sku: selectedVariant?.sku ?? product.sku,
        image: selectedVariant?.image ?? product.images[0],
        size,
        color,
        unitPrice,
        availableStock
      });
      writeStoredCart(next);
      if (buyNow) {
        setMessage("Added. Redirecting to cart...");
        window.location.assign("/cart");
      } else {
        setMessage("Added to cart.");
      }
    } catch {
      setMessage("Could not add to cart.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-6 grid gap-4 rounded-md bg-white p-4 shadow-sm sm:p-5">
      <label className="grid gap-2 text-sm font-semibold">
        Color
        <select value={color} onChange={(event) => setColor(event.target.value)} required className="h-11 rounded-md border border-ink/15 px-3">
          <option value="">Select color</option>
          {colors.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Size
        <select value={size} onChange={(event) => setSize(event.target.value)} required className="h-11 rounded-md border border-ink/15 px-3">
          <option value="">Select size</option>
          {sizes.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="grid gap-2 text-sm font-semibold">
        Quantity
        <div className="grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-md border border-ink/15">
          <button type="button" aria-label="Decrease quantity" onClick={() => setSafeQuantity(quantity - 1)} className="grid h-11 place-items-center bg-mist">
            <Minus className="h-4 w-4" />
          </button>
          <input value={quantity} onChange={(event) => setSafeQuantity(Number(event.target.value))} type="number" min={1} max={availableStock} className="h-11 text-center outline-none" />
          <button type="button" aria-label="Increase quantity" onClick={() => setSafeQuantity(quantity + 1)} className="grid h-11 place-items-center bg-mist">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md bg-mist p-3">
        <span className="text-sm text-ink/65">Total</span>
        <strong className="text-xl text-rosewood">{formatMoney(total)}</strong>
      </div>
      <p className="text-sm text-ink/60">{availableStock} in stock for this selection</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" disabled={pending || availableStock < 1} onClick={() => addToCart(false)}>
          <ShoppingBag className="mr-2 h-4 w-4" /> {pending ? "Adding..." : "Add to cart"}
        </Button>
        <Button type="button" variant="secondary" disabled={pending || availableStock < 1} onClick={() => addToCart(true)}>
          <Zap className="mr-2 h-4 w-4" /> {pending ? "Adding..." : "Buy now"}
        </Button>
      </div>
      <Button type="button" variant="ghost">
        <Heart className="mr-2 h-4 w-4" /> Add to wishlist
      </Button>
      {message ? <p className="rounded-md bg-saffron/15 p-3 text-sm font-semibold">{message}</p> : null}
    </section>
  );
}
