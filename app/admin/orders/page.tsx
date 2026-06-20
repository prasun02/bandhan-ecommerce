import { AdminOrderStatusForm } from "@/components/admin-order-status-form";

export default function AdminOrdersPage() {
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Order management</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-[420px_1fr]">
        <AdminOrderStatusForm />
        <div className="rounded-md bg-white p-6 shadow-sm">
        Search by order number, customer phone, name, status, payment method, and date. Order detail actions include status updates, payment updates, courier assignment, invoice, packing slip, cancellation, returns, and refunds.
        </div>
      </div>
    </main>
  );
}
