export type PaymentMethod = "cod" | "bkash" | "card";
export type PaymentStatus = "Pending" | "Processing" | "Paid" | "Failed" | "Cancelled" | "Refunded" | "Partially Refunded" | "Cash on Delivery Pending";

export type PaymentRequest = {
  orderNumber: string;
  amount: number;
  customerPhone: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
};

export type PaymentInitResult = {
  provider: PaymentMethod;
  status: PaymentStatus;
  redirectUrl?: string;
  reference: string;
};

export interface PaymentProvider {
  createPayment(request: PaymentRequest): Promise<PaymentInitResult>;
  verifyPayment(reference: string, payload: unknown): Promise<{ status: PaymentStatus; transactionId?: string }>;
}
