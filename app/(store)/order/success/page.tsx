import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-2xl rounded-md bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black">Order placed</h1>
        <p className="mt-3 text-ink/65">Your order number is ORD-2026-000001. Payment status and delivery estimate are shown after secure server-side creation.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/track-order"><Button>Track order</Button></Link>
          <Link href="/shop"><Button variant="secondary">Continue shopping</Button></Link>
        </div>
      </div>
    </main>
  );
}
