import { coupons } from "@/data/catalog";

export function applyCoupon(code: string | undefined, subtotal: number, deliveryCharge: number) {
  if (!code) return { discount: 0, deliveryDiscount: 0, coupon: undefined };
  const coupon = coupons.find((item) => item.code.toUpperCase() === code.toUpperCase() && item.active);
  if (!coupon || subtotal < coupon.minSubtotal) return { discount: 0, deliveryDiscount: 0, coupon: undefined };

  if (coupon.type === "free-delivery") {
    return { discount: 0, deliveryDiscount: deliveryCharge, coupon };
  }

  if (coupon.type === "fixed") {
    return { discount: coupon.value, deliveryDiscount: 0, coupon };
  }

  const calculated = Math.round((subtotal * coupon.value) / 100);
  return { discount: Math.min(calculated, coupon.maxDiscount), deliveryDiscount: 0, coupon };
}
