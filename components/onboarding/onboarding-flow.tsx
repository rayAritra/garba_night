"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout, saveProfile } from "@/app/actions";
import { validateFields, toPayload, type DraftField, type FieldErrors, type ProfileDraft } from "@/lib/profile-draft";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlowOrb, SectionLabel } from "@/components/ui/glass-panel";
import { BackIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ImageUploader, MIN_PHOTOS } from "@/components/profile/image-uploader";
import { BasicsFields, InterestsPicker, PreferencesFields, SocialsFields } from "@/components/profile/profile-fields";

const STEPS: { fields: DraftField[]; title: ReactNode; lede: string }[] = [
  {
    fields: ["name", "dateOfBirth", "gender", "year", "department", "bio"],
    title: (
      <>
        Tell them who’s <span className="serif text-[40px] text-saffron">coming.</span>
      </>
    ),
    lede: "The basics. Only your age shows — never your birthday.",
  },
  {
    fields: [],
    title: (
      <>
        Show them
        <br />
        your <span className="serif text-[40px] text-saffron">fit.</span>
      </>
    ),
    lede: "Two or three photos. The first one leads.",
  },
  {
    fields: ["interests"],
    title: (
      <>
        What’s your <span className="serif text-[40px] text-saffron">vibe?</span>
      </>
    ),
    lede: "Pick up to five. We’ll show them on your card.",
  },
  {
    fields: ["interestedIn", "instagram", "whatsapp"],
    title: (
      <>
        Who are you <span className="serif text-[40px] text-saffron">looking for?</span>
      </>
    ),
    lede: "Then add socials if you like — they stay hidden unless you share them with matches.",
  },
];

type Saved = { step: number; draft: ProfileDraft; removed: string[] };

const noop = () => () => {};

export function OnboardingFlow(props: { userId: string; initial: ProfileDraft; catalog: string[] }) {
  // Render the stateful flow only on the client so a saved draft can be restored without a hydration mismatch.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-6 px-6 pt-8">
        <Skeleton className="h-1 w-full" />
        <Skeleton className="mt-16 h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <Flow {...props} />;
}

function Flow({ userId, initial, catalog }: { userId: string; initial: ProfileDraft; catalog: string[] }) {
  const storageKey = `garba:onboarding:${userId}`;
  const [state, setState] = useState<Saved>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as Saved;
    } catch {}
    return { step: 0, draft: initial, removed: [] };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { step, draft } = state;

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [state, storageKey]);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step]);

  const set = useCallback((patch: Partial<ProfileDraft>) => setState((s) => ({ ...s, draft: { ...s.draft, ...patch } })), []);
  const go = (next: number) => {
    setErrors({});
    setFormError(null);
    setState((s) => ({ ...s, step: next }));
  };

  const photosReady = draft.photos.length >= MIN_PHOTOS && !uploading;

  const next = () => {
    const found = validateFields(draft, STEPS[step].fields);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError("Check the highlighted fields.");
      return;
    }
    if (step < STEPS.length - 1) return go(step + 1);

    startTransition(async () => {
      setFormError(null);
      const result = await saveProfile(toPayload(draft), draft.photos);
      if (!result || "error" in result) {
        setFormError(result?.error ?? "Couldn’t save your profile. Try again.");
        return;
      }
      if (state.removed.length) await createClient().storage.from(PHOTO_BUCKET).remove(state.removed);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      toast({ message: "You’re in. Welcome to the floor." });
      router.replace("/discover");
      router.refresh();
    });
  };

  return (
    <div className="relative isolate mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-x-clip">
      <GlowOrb className={cn("size-[460px] transition-all duration-700", step % 2 ? "-top-30 -right-40" : "-bottom-20 -left-45")} />
      <header className="pt-safe sticky top-0 z-20 flex flex-col gap-[18px] bg-night/80 px-5 pt-[18px] pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button type="button" aria-label="Back" onClick={() => go(step - 1)} className="-ml-2.5 flex size-11 items-center justify-center rounded-full hover:bg-white/5">
              <BackIcon />
            </button>
          ) : (
            <form action={logout}>
              <button type="submit" className="-ml-2 h-11 rounded-full px-2 text-[13px] font-semibold text-ink/50 hover:text-ink">
                Sign out
              </button>
            </form>
          )}
          <span className="text-[13px] font-semibold text-ink/50">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-[3px] flex-1 rounded-sm transition-colors duration-300", i <= step ? "bg-saffron" : "bg-white/10", i === step && "shadow-[0_0_12px_rgba(255,181,71,.6)]")} />
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-7 px-6 pt-8 pb-40">
        <section key={step} className="flex animate-rise flex-col gap-2">
          <h1 ref={headingRef} tabIndex={-1} className="m-0 text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em] outline-none">
            {STEPS[step].title}
          </h1>
          <p className="m-0 text-[15px] leading-normal text-ink/64">{STEPS[step].lede}</p>
        </section>

        <div key={`f${step}`} className="animate-rise">
          {step === 0 ? <BasicsFields draft={draft} set={set} errors={errors} /> : null}
          {step === 1 ? (
            <ImageUploader
              userId={userId}
              value={draft.photos}
              onChange={(photos) => set({ photos })}
              onRemove={(path) => setState((s) => ({ ...s, removed: [...s.removed, path] }))}
              onBusyChange={setUploading}
            />
          ) : null}
          {step === 2 ? <InterestsPicker draft={draft} set={set} errors={errors} catalog={catalog} /> : null}
          {step === 3 ? (
            <div className="flex flex-col gap-8">
              <PreferencesFields draft={draft} set={set} errors={errors} />
              <div className="flex flex-col gap-3">
                <SectionLabel>Socials</SectionLabel>
                <SocialsFields draft={draft} set={set} errors={errors} />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-linear-to-t from-night from-60% to-transparent px-6 pt-8 sm:pb-8">
        {formError ? (
          <p role="alert" className="m-0 mb-3 text-center text-[13px] text-danger">
            {formError}
          </p>
        ) : null}
        <Button block onClick={next} loading={pending} disabled={step === 1 && !photosReady}>
          {step === STEPS.length - 1 ? "Finish & start discovering" : step === 1 && uploading ? "Uploading…" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}
