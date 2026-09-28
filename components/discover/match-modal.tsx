"use client";

import { useEffect, useRef } from "react";
import { ButtonLink, Button } from "@/components/ui/button";
import { LikeIcon, StarburstIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/photo";

type Person = { id: string; name: string; photo: string | null };

const SPARKS = [
  { left: 30, top: 6, size: 16, color: "#FFB547", delay: 0.7 },
  { right: 30, top: 60, size: 12, color: "#FF7A9C", delay: 0.8 },
  { left: 110, top: 300, size: 10, color: "#FFD08A", delay: 0.85 },
  { right: 70, top: 290, size: 14, color: "#FFB547", delay: 0.9 },
  { left: 12, top: 200, size: 8, color: "#FF7A9C", delay: 0.95 },
];

/**
 * "It's a match" reveal, staged over ~1.2s: glow → both cards fly in → heart pops → headline → actions.
 * Only ever opened with a match id returned by `submit_swipe`.
 */
export function MatchModal({ matchId, me, them, onClose }: { matchId: string; me: Person; them: Person; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const primary = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    // Move focus to the main action once the reveal has settled.
    const timer = window.setTimeout(() => primary.current?.focus({ preventScroll: true }), 950);
    return () => {
      window.clearTimeout(timer);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="match-title"
      aria-describedby="match-desc"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-night-deep p-0 text-ink backdrop:bg-night-deep"
    >
      <div className="relative mx-auto flex h-full max-w-[480px] flex-col items-center">
        <div
          aria-hidden="true"
          className="absolute top-[18%] left-1/2 -ml-80 size-160 rounded-full blur-[20px] motion-safe:animate-[glow_.6s_ease-out_both]"
          style={{ background: "radial-gradient(circle, rgba(224,64,106,.42) 0, rgba(245,140,40,.18) 38%, transparent 66%)" }}
        />

        <div aria-hidden="true" className="relative mt-[max(72px,12dvh)] h-[360px] w-[390px] max-w-full shrink-0 origin-top [@media(max-height:720px)]:-mb-[72px] [@media(max-height:720px)]:scale-[.8]">
          <div className="absolute top-[34px] left-[44px] h-[236px] w-[172px] rotate-[-8deg] overflow-hidden rounded-[26px] border border-white/14 shadow-[0_30px_60px_rgba(0,0,0,.6)] motion-safe:animate-[inL_.55s_cubic-bezier(.2,.9,.25,1.1)_.15s_both]">
            <Photo path={me.photo} alt={me.name} seed={me.id} sizes="172px" className="text-5xl" />
          </div>
          <div className="absolute top-5 left-[172px] h-[236px] w-[172px] rotate-[7deg] overflow-hidden rounded-[26px] border border-white/14 shadow-[0_30px_60px_rgba(0,0,0,.6)] motion-safe:animate-[inR_.55s_cubic-bezier(.2,.9,.25,1.1)_.25s_both]">
            <Photo path={them.photo} alt={them.name} seed={them.id} sizes="172px" className="text-5xl" priority />
          </div>
          <div
            className="absolute top-[222px] left-[163px] flex size-16 items-center justify-center rounded-full text-[#FFF6EC] shadow-[0_0_0_6px_#040304,0_0_50px_rgba(224,64,106,.7)] motion-safe:animate-[pop_.45s_ease_.6s_both]"
            style={{ background: "linear-gradient(135deg, #E0406A, #F08A2C)" }}
          >
            <LikeIcon size={28} />
          </div>
          {SPARKS.map((spark, i) => (
            <StarburstIcon
              key={i}
              size={spark.size}
              className="absolute motion-safe:animate-[spark_.6s_ease_both]"
              style={{ left: spark.left, right: spark.right, top: spark.top, color: spark.color, animationDelay: `${spark.delay}s` }}
            />
          ))}
        </div>

        <section className="relative mt-5 flex flex-col items-center gap-2.5 px-6 text-center motion-safe:animate-[up_.45s_ease_.75s_both]">
          <p className="m-0 text-[40px] leading-none">
            <span className="serif text-rose-soft">it&apos;s a</span>
          </p>
          <h1 id="match-title" className="m-0 -mt-1.5 text-[64px] leading-[0.95] font-extrabold tracking-[-0.05em]">
            MATCH
          </h1>
          <p id="match-desc" className="m-0 mt-1 text-base text-ink/72">
            You and {them.name} both felt the vibe.
          </p>
        </section>

        <footer className="pb-safe relative mt-auto flex w-full flex-col gap-2.5 px-6 pt-6 motion-safe:animate-[up_.45s_ease_.9s_both] sm:pb-10">
          <ButtonLink ref={primary} href={`/messages/${matchId}`} block>
            Send a message
          </ButtonLink>
          <Button variant="secondary" size="md" block onClick={onClose}>
            Keep swiping
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
