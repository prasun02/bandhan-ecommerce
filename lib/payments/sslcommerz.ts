import "server-only";
import type { PaymentProvider } from "@/lib/payments/provider";

export class SslCommerzPaymentProvider implements PaymentProvider {
  async createPayment(request: Parameters<PaymentProvider["createPayment"]>[0]) {
    if (!process.env.SSLCOMMERZ_STORE_ID || !process.env.SSLCOMMERZ_STORE_PASSWORD) {
      return {
        provider: "card" as const,
        status: "Pending" as const,
        reference: `MOCK-SSLC-${request.orderNumber}`,
        redirectUrl: `/checkout/mock-payment?provider=card&order=${request.orderNumber}`
      };
    }

    throw new Error("Live SSLCommerz session creation must be enabled with store credentials and IPN validation.");
  }

  async verifyPayment(reference: string) {
    if (reference.startsWith("MOCK-SSLC-")) return { status: "Pending" as const };
    throw new Error("Validate SSLCommerz transaction through validation API/IPN before marking paid.");
  }
}
