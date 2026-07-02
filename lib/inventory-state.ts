export type InventoryState = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

export function inventoryState(
  stockQuantity: number,
  lowStockLimit: number
): InventoryState {
  if (stockQuantity <= 0) return "OUT_OF_STOCK";
  if (stockQuantity <= lowStockLimit) return "LOW_STOCK";
  return "IN_STOCK";
}
