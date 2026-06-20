"use client";

import { useState } from "react";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  estimatedDelivery: string | null;
  statusHistory: { status: string; note: string | null; createdAt: string }[];
  shipment: { courierName: string | null; consignmentNumber: string | null; trackingUrl: string | null } | null;
};

export function TrackOrderClient() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [message, setMessage] = useState("");

  async function track(formData: FormData) {
    setMessage("");
    setOrder(null);
    const response = await fetch("/api/track-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: formData.get("orderNumber"), phone: formData.get("phone") })
    });
    const result = (await response.json()) as TrackedOrder | { error?: string };
    if (!response.ok) {
      setMessage("error" in result ? result.error ?? "Order not found." : "Order not found.");
      return;
    }
    setOrder(result as TrackedOrder);
  }

  return (
    <main className="container py-8">
      <div className="mx-auto max-w-2xl rounded-md bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">Track order</h1>
        <form action={track} className="mt-6 grid gap-4">
          <input name="orderNumber" required placeholder="ORD-2026-000001" className="h-11 rounded-md border border-ink/15 px-3" />
          <input name="phone" required placeholder="Phone number used for order" className="h-11 rounded-md border border-ink/15 px-3" />
          <button className="h-11 rounded-md bg-ink font-bold text-white">Track</button>
        </form>
        {message ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
        {order ? (
          <section className="mt-6 grid gap-4">
            <div className="rounded-md bg-mist p-4">
              <p className="font-black">{order.orderNumber}</p>
              <p className="mt-1 text-sm">Order: {order.status} / Payment: {order.paymentStatus}</p>
              <p className="mt-1 text-sm">Estimated delivery: {order.estimatedDelivery ?? "Pending"}</p>
              {order.shipment?.courierName ? <p className="mt-1 text-sm">Courier: {order.shipment.courierName} {order.shipment.consignmentNumber}</p> : null}
            </div>
            <ol className="grid gap-3">
              {order.statusHistory.map((entry) => (
                <li key={`${entry.status}-${entry.createdAt}`} className="rounded-md border border-ink/10 p-3">
                  <strong>{entry.status.replaceAll("_", " ")}</strong>
                  <p className="text-sm text-ink/60">{new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note ? <p className="mt-1 text-sm">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
