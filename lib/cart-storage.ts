import type { CartLineInput } from "@/lib/services/order";

export type StoredCartLine = CartLineInput & {
  name: string;
  sku: string;
  image: string;
  size?: string;
  color?: string;
  unitPrice: number;
  availableStock: number;
};

export const CART_STORAGE_KEY = "noor_cart";
export const GUEST_KEY_STORAGE_KEY = "noor_guest_key";

export function getGuestKey() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(GUEST_KEY_STORAGE_KEY);
  if (existing) return existing;
  const created = `guest_${crypto.randomUUID()}`;
  window.localStorage.setItem(GUEST_KEY_STORAGE_KEY, created);
  return created;
}

export function readStoredCart() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredCartLine[];
  } catch {
    return [];
  }
}

export function writeStoredCart(lines: StoredCartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("noor-cart-updated"));
}
