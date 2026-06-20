# Payment Integration Guide

Payment code lives in `lib/payments`.

- `cod.ts` creates Cash on Delivery pending payments.
- `bkash.ts` contains the bKash adapter boundary.
- `sslcommerz.ts` contains the SSLCommerz/card adapter boundary.
- `provider.ts` defines shared request and verification contracts.

Do not mark bKash or card payments paid from frontend redirects. Always verify through the provider execute/query/validation API or IPN/webhook before updating `Payment.status` and `Order.paymentStatus`.
