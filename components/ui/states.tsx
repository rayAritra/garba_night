import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertIcon, StarburstIcon } from "@/components/ui/icons";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-[length:200%_100%] motion-safe:animate-[shimmer_1.6s_linear_infinite]", className)}
      style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 100%)", ...style }}
    />
  );
}

export function EmptyState({ title, body, action, icon, className }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <section className={cn("flex animate-rise flex-col items-center gap-3.5 px-8 text-center", className)}>
      <div aria-hidden="true" className="flex size-22 items-center justify-center rounded-full text-saffron" style={{ background: "radial-gradient(circle, rgba(255,181,71,.18), transparent 70%)" }}>
        {icon ?? <StarburstIcon size={30} />}
      </div>
      <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.03em] text-balance">{title}</h2>
      {body ? <p className="m-0 max-w-[300px] text-[15px] leading-normal text-ink/62">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  );
}

export function ErrorState({ title = "Something slipped.", body = "We couldn’t load this. Check your connection and try again.", action, className }: { title?: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section role="alert" className={cn("flex animate-rise flex-col items-center gap-3 px-8 text-center", className)}>
      <div aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-rose/12 text-danger">
        <AlertIcon size={26} />
      </div>
      <h2 className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{title}</h2>
      <p className="m-0 max-w-[300px] text-[15px] leading-normal text-ink/62">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  );
}
