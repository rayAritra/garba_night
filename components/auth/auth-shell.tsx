import Link from "next/link";
import type { ReactNode } from "react";
import { GlowOrb } from "@/components/ui/glass-panel";
import { BackIcon } from "@/components/ui/icons";
import { CreatorCredit } from "@/components/ui/creator-credit";

/** Signup.html frame: back link, big headline with a serif accent, lede, then the form. */
export function AuthShell({ title, lede, back = "/", children }: { title: ReactNode; lede: string; back?: string; children: ReactNode }) {
  return (
    <div className="relative isolate mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden">
      <GlowOrb className="-top-40 -left-30 size-[480px]" style={{ background: "radial-gradient(circle, rgba(245,140,40,.28), transparent 65%)" }} />
      <GlowOrb color="magenta" className="-right-50 bottom-20 size-[420px]" />
      <header className="pt-safe flex h-16 items-center px-3">
        <Link href={back} aria-label="Back" className="flex size-11 items-center justify-center rounded-full hover:bg-white/5">
          <BackIcon />
        </Link>
      </header>
      <main className="flex flex-1 flex-col px-6 pt-8">
        <section className="flex animate-rise flex-col gap-2.5">
          <h1 className="m-0 text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] text-balance">{title}</h1>
          <p className="m-0 text-[15px] leading-normal text-ink/64">{lede}</p>
        </section>
        {children}
        <CreatorCredit variant="pill" className="mx-auto mb-[max(16px,env(safe-area-inset-bottom))]" />
      </main>
    </div>
  );
}
