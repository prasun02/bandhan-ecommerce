import { deliveryZones } from "@/data/catalog";

export function calculateDelivery(zoneId: string, subtotal: number, paymentMethod: "cod" | "bkash" | "card") {
  const zone = deliveryZones.find((item) => item.id === zoneId);
  if (!zone) throw new Error("Invalid delivery zone.");
  const baseCharge = subtotal >= zone.freeThreshold ? 0 : zone.charge;
  const codCharge = paymentMethod === "cod" ? zone.codCharge : 0;
  return {
    zone,
    charge: baseCharge + codCharge,
    estimatedDays: `${zone.minDays}-${zone.maxDays} business days`
  };
}
