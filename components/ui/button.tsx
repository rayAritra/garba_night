import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "lg" | "md" | "sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2.5 rounded-full font-bold whitespace-nowrap no-underline transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150 ease-out active:scale-[0.97] disabled:active:scale-100 aria-disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "accent-gradient text-on-accent shadow-[0_12px_40px_rgba(240,138,44,.3),inset_0_1px_0_rgba(255,255,255,.4)] hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(240,138,44,.45),inset_0_1px_0_rgba(255,255,255,.4)] disabled:translate-y-0 disabled:bg-none disabled:bg-white/6 disabled:text-ink/40 disabled:shadow-none",
  secondary: "border border-white/12 bg-surface/60 text-ink font-semibold backdrop-blur-xl hover:bg-hover disabled:opacity-50",
  ghost: "text-ink/72 font-semibold hover:bg-white/5 hover:text-ink disabled:opacity-50",
  quiet: "bg-white/6 text-ink font-semibold hover:bg-white/10 disabled:opacity-50",
  danger: "border border-danger/40 bg-rose/12 text-danger font-semibold hover:bg-rose/20 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  lg: "h-14 px-7 text-base",
  md: "h-[52px] px-6 text-[15px]",
  sm: "h-11 px-[18px] text-sm",
};

export type ButtonStyleProps = { variant?: Variant; size?: Size; block?: boolean };

export function buttonClass({ variant = "primary", size = "lg", block }: ButtonStyleProps = {}, className?: string) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

function Spinner() {
  return <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

export function Button({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyleProps & { loading?: boolean }) {
  return (
    <button type={type} className={buttonClass({ variant, size, block }, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...props} />;
}

/** Round, 44px-minimum icon button. Always pass an aria-label. */
export function IconButton({
  label,
  className,
  children,
  tone = "glass",
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & { label: string; tone?: "glass" | "plain"; children: ReactNode }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-150 active:scale-90 disabled:opacity-40",
        tone === "glass" ? "glass hover:bg-hover" : "hover:bg-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconLink({ label, className, children, ...props }: Omit<ComponentProps<typeof Link>, "aria-label"> & { label: string }) {
  return (
    <Link aria-label={label} className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-white/5", className)} {...props}>
      {children}
    </Link>
  );
}
