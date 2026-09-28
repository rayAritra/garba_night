import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Frosted surface used for floating chrome: nav, composer, sheets, overlays. */
export function GlassPanel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass shadow-[0_20px_60px_rgba(0,0,0,.5)]", className)} {...props} />;
}

/** Soft blurred light source behind content. Purely decorative. */
export function GlowOrb({ className, color = "ember", style }: { className?: string; color?: "ember" | "magenta" | "rose"; style?: React.CSSProperties }) {
  const tint = { ember: "rgba(245,140,40,.24)", magenta: "rgba(184,50,122,.2)", rose: "rgba(224,64,106,.2)" }[color];
  return <div aria-hidden="true" className={cn("glow-orb -z-10", className)} style={{ background: `radial-gradient(circle, ${tint}, transparent 65%)`, ...style }} />;
}

/** Wordmark: "garba after dark". */
export function Wordmark({ className, large }: { className?: string; large?: boolean }) {
  return (
    <span className={cn("font-bold tracking-[-0.02em]", large ? "text-lg" : "text-base", className)}>
      garba<span className={cn("serif ml-[3px] text-saffron", large ? "text-[21px]" : "text-[19px]")}>after dark</span>
    </span>
  );
}

/** Uppercase section label from the type scale (12 · 600 · +8–10% caps). */
export function SectionLabel({ className, as: Tag = "h2", ...props }: ComponentProps<"h2"> & { as?: "h2" | "h3" | "p" | "span" }) {
  return <Tag className={cn("m-0 text-xs font-semibold tracking-[0.08em] text-ink/50 uppercase", className)} {...props} />;
}
