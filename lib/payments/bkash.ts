import "server-only";
import type { PaymentProvider } from "@/lib/payments/provider";

export class BkashPaymentProvider implements PaymentProvider {
  async createPayment(request: Parameters<PaymentProvider["createPayment"]>[0]) {
    if (!process.env.BKASH_APP_KEY || !process.env.BKASH_APP_SECRET) {
      return {
        provider: "bkash" as const,
        status: "Pending" as const,
        reference: `MOCK-BKASH-${request.orderNumber}`,
        redirectUrl: `/checkout/mock-payment?provider=bkash&order=${request.orderNumber}`
      };
    }

    throw new Error("Live bKash tokenized checkout API call must be enabled with merchant credentials and server-side verification.");
  }

  async verifyPayment(reference: string) {
    if (reference.startsWith("MOCK-BKASH-")) return { status: "Pending" as const };
    throw new Error("Verify bKash payment with the execute/query payment API before marking paid.");
  }
}
