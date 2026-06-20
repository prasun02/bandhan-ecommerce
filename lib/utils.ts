import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountPaisa: number) {
  return `৳${(amountPaisa / 100).toLocaleString("en-BD", {
    maximumFractionDigits: 0
  })}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
