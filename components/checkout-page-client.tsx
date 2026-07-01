"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, MapPin, PackageCheck, Truck, Wallet } from "lucide-react";
import { deliveryZones } from "@/data/catalog";
import type { StoredCartLine } from "@/lib/cart-storage";
import { formatMoney } from "@/lib/utils";

type PaymentMethod = "cod" | "bkash" | "card";

export function CheckoutPageClient() {
  const [lines, setLines] = useState<StoredCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [deliveryZoneId, setDeliveryZoneId] = useState("dhaka");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((response) => response.json())
      .then((cart: { lines?: StoredCartLine[] }) => setLines(cart.lines ?? []))
      .catch(() => setMessage("Could not load your cart."));
  }, []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [lines]);
  const zone = deliveryZones.find((item) => item.id === deliveryZoneId) ?? deliveryZones[0];
  const deliveryCharge = (subtotal >= zone.freeThreshold ? 0 : zone.charge) + (paymentMethod === "cod" ? zone.codCharge : 0);
  const total = subtotal + deliveryCharge;

  async function submitOrder(formData: FormData) {
    setMessage("");
    setOrderNumber("");
    if (lines.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }
    setPending(true);
    const idempotencyKey = `idem_${crypto.randomUUID()}`;
    const checkout = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      alternativePhone: String(formData.get("alternativePhone") ?? ""),
      email: String(formData.get("email") ?? ""),
      division: String(formData.get("division") ?? ""),
      district: String(formData.get("district") ?? ""),
      upazila: String(formData.get("upazila") ?? ""),
      area: String(formData.get("area") ?? ""),
      street: String(formData.get("street") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      landmark: String(formData.get("landmark") ?? ""),
      deliveryZoneId,
      paymentMethod,
      couponCode: String(formData.get("couponCode") ?? ""),
      termsAccepted: formData.get("termsAccepted") === "on",
      idempotencyKey
    };
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkout
      })
    });
    const result = (await response.json()) as { orderNumber?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "Order could not be created.");
      return;
    }
    setLines([]);
    setOrderNumber(result.orderNumber ?? "");
  }

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Checkout</h1>
      {message ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
      {orderNumber ? <p className="mt-4 rounded-md bg-green-50 p-3 text-sm font-semibold text-green-800">Order created: {orderNumber}</p> : null}
      <form action={submitOrder} className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="grid gap-5">
          <fieldset className="rounded-md bg-white p-5 shadow-card">
            <legend className="flex items-center gap-2 text-lg font-black"><PackageCheck className="h-5 w-5" /> Customer information</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="fullName" required placeholder="Full name" className="h-11 rounded-md border border-ink/15 px-3" />
              <input name="phone" required placeholder="Phone number" className="h-11 rounded-md border border-ink/15 px-3" />
              <input name="alternativePhone" placeholder="Alternative phone" className="h-11 rounded-md border border-ink/15 px-3" />
              <input name="email" type="email" placeholder="Email" className="h-11 rounded-md border border-ink/15 px-3" />
            </div>
          </fieldset>
          <fieldset className="rounded-md bg-white p-5 shadow-card">
            <legend className="flex items-center gap-2 text-lg font-black"><MapPin className="h-5 w-5" /> Confirm delivery address</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["division", "district", "upazila", "area", "street", "postalCode", "landmark"].map((field) => (
                <input key={field} name={field} required={!["postalCode", "landmark"].includes(field)} placeholder={field.replace(/^\w/, (letter) => letter.toUpperCase())} className="h-11 rounded-md border border-ink/15 px-3" />
              ))}
            </div>
          </fieldset>
          <fieldset className="rounded-md bg-white p-5 shadow-card">
            <legend className="flex items-center gap-2 text-lg font-black"><Truck className="h-5 w-5" /> Delivery option</legend>
            <select value={deliveryZoneId} onChange={(event) => setDeliveryZoneId(event.target.value)} className="mt-4 h-11 w-full rounded-md border border-ink/15 px-3">
              {deliveryZones.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.minDays}-{item.maxDays} days)</option>)}
            </select>
          </fieldset>
          <fieldset className="rounded-md bg-white p-5 shadow-card">
            <legend className="flex items-center gap-2 text-lg font-black"><Wallet className="h-5 w-5" /> Payment method</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["cod", "Cash on Delivery", Wallet],
                ["bkash", "bKash", Wallet],
                ["card", "Card", CreditCard]
              ].map(([value, label, Icon]) => (
                <label key={String(value)} className="flex cursor-pointer items-center gap-2 rounded-md border border-ink/15 p-3">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === value} onChange={() => setPaymentMethod(value as PaymentMethod)} />
                  <Icon className="h-4 w-4" /> {String(label)}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
        <aside className="h-fit rounded-md bg-white p-5 shadow-card lg:sticky lg:top-28">
          <h2 className="text-xl font-black">Review and confirm</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {lines.map((line) => (
              <div key={`${line.productId}-${line.variantId}`} className="flex justify-between gap-3">
                <span>{line.name} x {line.quantity}</span>
                <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
              </div>
            ))}
            <input name="couponCode" placeholder="Coupon code" className="mt-2 h-11 rounded-md border border-ink/15 px-3" />
            <div className="flex justify-between border-t border-ink/10 pt-3"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
            <div className="flex justify-between"><span>Delivery</span><strong>{formatMoney(deliveryCharge)}</strong></div>
            <div className="flex justify-between text-lg"><span>Total payable</span><strong className="text-rosewood">{formatMoney(total)}</strong></div>
            <p className="rounded-md bg-mist p-3 text-xs leading-5">This preview is recalculated on the server before the order is saved. Browser totals are never trusted.</p>
            <label className="flex items-start gap-2">
              <input name="termsAccepted" required type="checkbox" className="mt-1" />
              <span>I confirm my address, products, quantities, payment method, and terms.</span>
            </label>
          </div>
          <button disabled={pending || lines.length === 0} className="mt-5 h-11 w-full rounded-md bg-rosewood font-bold text-white disabled:opacity-50">
            {pending ? "Placing order..." : "Place order"}
          </button>
        </aside>
      </form>
    </main>
  );
}
