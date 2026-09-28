import Link from "next/link";
import { CREATOR, EVENT } from "@/lib/constants";
import { eventDate, eventKicker, eventPlace, eventTime, eventTitle } from "@/lib/event";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { GlowOrb, Wordmark } from "@/components/ui/glass-panel";
import { ArrowRightIcon, CloseIcon, LikeIcon } from "@/components/ui/icons";
import { CardArt, Grain } from "@/components/landing/card-art";

const STEPS = [
  { n: "01", title: "DISCOVER", body: "Find someone who matches your vibe." },
  { n: "02", title: "MATCH", body: "You both liked each other? It’s a match." },
  { n: "03", title: "CHAT", body: "Break the ice before the night begins." },
  { n: "04", title: "MEET", body: "Find each other at Garba." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const primary = user ? { href: "/discover", label: "Open the app" } : { href: "/signup", label: "Find my match" };

  return (
    <div className="relative isolate overflow-hidden">
      <GlowOrb className="-bottom-30 -left-40 size-[520px] motion-safe:animate-drift lg:top-[360px] lg:bottom-auto lg:-left-65 lg:size-[900px]" style={{ background: "radial-gradient(circle, rgba(245,140,40,.3), transparent 64%)" }} />
      <GlowOrb color="magenta" className="-top-35 -right-45 size-[460px] lg:-top-65 lg:-right-60 lg:size-[820px]" />

      {/* Nav: plain header on mobile, floating glass pill on desktop */}
      <header className="pt-safe absolute inset-x-0 top-0 z-10 lg:top-6">
        <nav aria-label="Main" className="mx-auto flex h-[72px] items-center justify-between px-5 lg:h-16 lg:max-w-[1120px] lg:border lg:border-white/7 lg:bg-surface/55 lg:backdrop-blur-[20px] lg:backdrop-saturate-[140%] lg:rounded-full lg:pr-2.5 lg:pl-7 lg:shadow-[0_20px_60px_rgba(0,0,0,.45)]">
          <Wordmark className="lg:text-[17px]" />
          <div className="hidden gap-1 lg:flex">
            <a href="#how" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/72 no-underline hover:bg-white/5 hover:text-ink">
              How it works
            </a>
            <a href="#event" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/72 no-underline hover:bg-white/5 hover:text-ink">
              Event
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            {user ? null : (
              <Link href="/login" className="hidden h-11 items-center rounded-full px-4 text-sm font-semibold text-ink/72 no-underline hover:bg-white/5 hover:text-ink lg:inline-flex">
                Sign in
              </Link>
            )}
            <ButtonLink href={user ? "/discover" : "/signup"} size="sm" variant="secondary" className="h-10 lg:hidden">
              {user ? "Open app" : "Join"}
            </ButtonLink>
            <ButtonLink href={primary.href} size="sm" className="hidden lg:inline-flex">
              {user ? "Open the app" : "Join now"}
            </ButtonLink>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col justify-end px-6 pb-10 lg:grid lg:min-h-0 lg:max-w-[1120px] lg:grid-cols-[620px_1fr] lg:items-start lg:gap-10 lg:px-0 lg:pt-[200px] lg:pb-0">
        <div aria-hidden="true" className="absolute top-[92px] left-1/2 h-[380px] w-[390px] -translate-x-1/2 lg:relative lg:top-[-50px] lg:left-auto lg:order-2 lg:h-[640px] lg:w-[520px] lg:translate-x-0">
          <CardArt tone={2} className="top-10 left-[38px] h-[260px] w-[188px] -rotate-9 rounded-[26px] opacity-80 shadow-[0_30px_60px_rgba(0,0,0,.6)] lg:top-[150px] lg:left-0 lg:h-[350px] lg:w-[250px] lg:-rotate-11 lg:rounded-card lg:opacity-70" />
          <CardArt tone={3} className="hidden lg:top-[110px] lg:right-0 lg:block lg:h-[350px] lg:w-[250px] lg:rotate-10 lg:rounded-card lg:opacity-80" />
          <CardArt tone={1} className="top-2.5 left-[150px] h-[290px] w-[210px] rotate-6 rounded-[28px] border-white/10 shadow-[0_40px_80px_rgba(0,0,0,.7),0_0_80px_rgba(245,140,40,.18)] lg:top-10 lg:left-[120px] lg:h-[420px] lg:w-[290px] lg:rotate-0 lg:rounded-[32px] lg:border-white/12">
            <div className="absolute inset-x-0 bottom-0 h-[110px] bg-linear-to-t from-night/90 to-transparent lg:h-[170px]" />
            <span className="absolute bottom-4 left-4 text-[17px] font-bold tracking-[-0.01em] lg:bottom-5 lg:left-5 lg:text-[26px] lg:font-extrabold lg:tracking-[-0.03em]">
              <span className="lg:hidden">Your match?</span>
              <span className="hidden lg:inline">Could be you</span>
            </span>
          </CardArt>
          <span className="glass absolute top-[250px] left-[136px] flex size-13 items-center justify-center rounded-full text-saffron shadow-[0_0_40px_rgba(224,64,106,.4)] lg:hidden">
            <LikeIcon size={22} />
          </span>
          <div className="hidden lg:absolute lg:top-[490px] lg:left-[225px] lg:flex lg:gap-[18px]">
            <span className="glass flex size-15 items-center justify-center rounded-full text-ink/80">
              <CloseIcon size={22} />
            </span>
            <span className="glass flex size-15 items-center justify-center rounded-full border-saffron/35 text-saffron shadow-[0_0_40px_rgba(245,140,40,.3)]">
              <LikeIcon size={24} />
            </span>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-linear-to-t from-night from-55% to-transparent lg:hidden" />

        <div className="relative flex flex-col gap-5 lg:order-1 lg:gap-7">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-ink/60 uppercase lg:text-[13px] lg:tracking-[0.16em]">{eventKicker}</p>
          <h1 className="m-0 text-[52px] leading-[0.94] font-extrabold tracking-[-0.045em] lg:text-[104px] lg:leading-[0.9] lg:tracking-[-0.05em]">
            DON&apos;T
            <br />
            GARBA
            <br />
            <span className="serif text-[64px] tracking-[-0.02em] text-saffron lg:text-[132px]">alone.</span>
          </h1>
          <p className="m-0 max-w-[280px] text-base leading-normal text-ink/70 lg:max-w-[420px] lg:text-[19px] lg:leading-[1.55]">
            Find your vibe before the music starts.<span className="hidden lg:inline"> Match with people from campus, chat, and meet them on the floor.</span>
          </p>
          <div className="mt-1.5 flex flex-col gap-2.5 lg:mt-2 lg:flex-row lg:items-center lg:gap-3">
            <ButtonLink href={primary.href} block className="lg:h-15 lg:w-auto lg:px-8 lg:text-[17px]">
              {primary.label}
              <ArrowRightIcon size={18} />
            </ButtonLink>
            <a href="#how" className="flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-ink/72 no-underline hover:bg-white/5 hover:text-ink lg:h-15 lg:text-base">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-h" className="relative mx-auto flex max-w-[480px] scroll-mt-10 flex-col gap-10 px-6 pt-20 lg:max-w-[1120px] lg:gap-14 lg:px-0 lg:pt-[120px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <h2 id="how-h" className="m-0 max-w-[640px] text-[40px] leading-none font-extrabold tracking-[-0.04em] lg:text-[56px]">
            From first swipe
            <br />
            to the <span className="serif text-[48px] text-saffron lg:text-[68px]">dance floor.</span>
          </h2>
          <p className="m-0 max-w-[320px] text-base leading-relaxed text-ink/60">No invite codes. No waiting list. Sign up, add a few photos, and you’re in.</p>
        </div>
        <ol className="m-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {STEPS.map((step, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li key={step.n} className={`flex flex-col gap-3.5 border-t pt-7 ${last ? "border-saffron" : "border-white/10"}`}>
                <span aria-hidden="true" className={`text-[72px] leading-[0.9] font-extrabold tracking-[-0.05em] lg:text-[88px] ${last ? "text-saffron [text-shadow:0_0_40px_rgba(255,181,71,.35)]" : "text-ink/14"}`}>
                  {step.n}
                </span>
                <h3 className="m-0 text-[22px] font-extrabold tracking-[0.02em]">{step.title}</h3>
                <p className="m-0 text-base leading-[1.55] text-ink/62">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Event */}
      <section id="event" aria-label="Event" className="pb-safe relative mx-auto mt-20 flex max-w-[480px] scroll-mt-10 flex-col gap-8 border-t border-white/8 px-6 pt-10 pb-16 lg:mt-[120px] lg:max-w-[1120px] lg:flex-row lg:items-center lg:justify-between lg:px-0 lg:pb-20">
        <dl className="m-0 flex flex-col gap-6 sm:flex-row sm:gap-14">
          {[
            ["When", `${eventDate} · ${eventTime}`],
            ...(eventPlace ? [["Where", eventPlace]] : []),
            ["Dress code", EVENT.dressCode],
          ].map(([term, value]) => (
            <div key={term} className="flex flex-col gap-1.5">
              <dt className="text-xs font-semibold tracking-[0.12em] text-ink/46 uppercase">{term}</dt>
              <dd className="m-0 text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <ButtonLink href={primary.href} className="self-start lg:self-auto">
          {primary.label}
        </ButtonLink>
      </section>

      <footer className="pb-safe relative mx-auto flex max-w-[480px] flex-col gap-2 border-t border-white/6 px-6 pt-6 pb-8 text-[13px] text-ink/46 sm:flex-row sm:items-center sm:justify-between lg:max-w-[1120px] lg:px-0">
        <span>
          {eventTitle} · {eventPlace}
        </span>
        <span>
          Made by{" "}
          <a href={CREATOR.github} target="_blank" rel="noopener noreferrer" className="font-semibold text-saffron no-underline hover:text-saffron-soft">
            {CREATOR.name}
          </a>
        </span>
      </footer>

      <Grain id="grain" />
    </div>
  );
}
