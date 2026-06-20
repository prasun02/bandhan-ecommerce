import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("inline-flex rounded-full border border-saffron/30 bg-saffron/15 px-3 py-1 text-xs font-semibold text-rosewood", className)}>
      {children}
    </span>
  );
}
