import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Toggleable interest chip (onboarding / edit). 44px tall touch target. */
export function InterestChip({ selected, className, ...props }: Omit<ComponentProps<"button">, "aria-pressed"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "h-11 rounded-full px-[18px] text-[15px] font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-95 disabled:opacity-40",
        selected
          ? "border border-saffron/60 bg-saffron/14 text-saffron-soft shadow-[0_0_24px_rgba(255,160,60,.18)]"
          : "border border-white/8 bg-surface text-ink/78 hover:border-white/14 hover:bg-hover",
        className,
      )}
      {...props}
    />
  );
}

/** Static tag. `photo` sits on imagery, `selected` highlights a shared/primary interest. */
export function Tag({ variant = "photo", className, ...props }: ComponentProps<"span"> & { variant?: "photo" | "default" | "selected" }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
        variant === "photo" && "border border-white/10 bg-white/10 text-ink backdrop-blur-md",
        variant === "default" && "border border-white/8 bg-surface text-ink/80",
        variant === "selected" && "border border-saffron/35 bg-saffron/12 text-saffron-soft",
        className,
      )}
      {...props}
    />
  );
}
