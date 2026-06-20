"use client";

import { useState } from "react";

export function AdminOrderStatusForm() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: formData.get("orderNumber"),
        status: formData.get("status"),
        paymentStatus: formData.get("paymentStatus") || undefined,
        courierName: formData.get("courierName") || undefined,
        consignmentNumber: formData.get("consignmentNumber") || undefined,
        trackingUrl: formData.get("trackingUrl") || undefined,
        note: formData.get("note") || undefined,
        customerVisible: formData.get("customerVisible") === "on"
      })
    });
    const result = (await response.json()) as { orderNumber?: string; error?: string };
    setMessage(response.ok ? `Updated ${result.orderNumber}` : result.error ?? "Order update failed.");
  }

  return (
    <form action={submit} className="grid gap-3 rounded-md bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Update order status</h2>
      <input name="orderNumber" required placeholder="ORD-2026-000001" className="h-11 rounded-md border border-ink/15 px-3" />
      <select name="status" required className="h-11 rounded-md border border-ink/15 px-3">
        {["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
      </select>
      <select name="paymentStatus" className="h-11 rounded-md border border-ink/15 px-3">
        <option value="">Leave payment unchanged</option>
        {["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "COD_PENDING"].map((status) => <option key={status}>{status}</option>)}
      </select>
      <input name="courierName" placeholder="Courier name" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="consignmentNumber" placeholder="Tracking / consignment number" className="h-11 rounded-md border border-ink/15 px-3" />
      <input name="trackingUrl" type="url" placeholder="Tracking URL" className="h-11 rounded-md border border-ink/15 px-3" />
      <textarea name="note" placeholder="Customer-visible or internal note" className="min-h-24 rounded-md border border-ink/15 p-3" />
      <label className="flex items-center gap-2 text-sm"><input name="customerVisible" type="checkbox" defaultChecked /> Show on customer timeline</label>
      <button className="h-11 rounded-md bg-rosewood font-bold text-white">Update order</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}
