import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-rosewood text-white shadow-sm hover:bg-[#651832]",
        variant === "secondary" && "border border-saffron/50 bg-white text-rosewood hover:bg-blush",
        variant === "ghost" && "text-ink hover:bg-blush",
        variant === "danger" && "bg-danger text-white hover:bg-red-800",
        className
      )}
      {...props}
    />
  );
}
