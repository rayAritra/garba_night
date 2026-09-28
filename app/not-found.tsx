import { ButtonLink } from "@/components/ui/button";
import { GlowOrb, Wordmark } from "@/components/ui/glass-panel";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden px-8 text-center">
      <GlowOrb color="magenta" className="top-1/4 left-1/2 -ml-[260px] size-[520px]" />
      <Wordmark />
      <p aria-hidden="true" className="serif m-0 text-[96px] leading-none text-saffron">404</p>
      <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.03em]">Wrong circle.</h1>
      <p className="m-0 max-w-[300px] text-[15px] leading-normal text-ink/62">This page stepped off the dance floor. Let’s get you back to the music.</p>
      <ButtonLink href="/" size="md" className="mt-2">
        Back to the floor
      </ButtonLink>
    </main>
  );
}
