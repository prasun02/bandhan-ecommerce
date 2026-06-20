import type { PaymentProvider } from "@/lib/payments/provider";

export class CashOnDeliveryProvider implements PaymentProvider {
  async createPayment(request: Parameters<PaymentProvider["createPayment"]>[0]) {
    return {
      provider: "cod" as const,
      status: "Cash on Delivery Pending" as const,
      reference: `COD-${request.orderNumber}`
    };
  }

  async verifyPayment() {
    return { status: "Cash on Delivery Pending" as const };
  }
}
