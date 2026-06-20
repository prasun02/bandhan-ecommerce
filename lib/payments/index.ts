import { BkashPaymentProvider } from "@/lib/payments/bkash";
import { CashOnDeliveryProvider } from "@/lib/payments/cod";
import { SslCommerzPaymentProvider } from "@/lib/payments/sslcommerz";
import type { PaymentMethod } from "@/lib/payments/provider";

export function getPaymentProvider(method: PaymentMethod) {
  if (method === "bkash") return new BkashPaymentProvider();
  if (method === "card") return new SslCommerzPaymentProvider();
  return new CashOnDeliveryProvider();
}
