"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { PHOTO_BUCKET } from "@/lib/photos";
import { toPayload, validateFields, type FieldErrors, type ProfileDraft } from "@/lib/profile-draft";
import { createClient } from "@/lib/supabase/client";
import { Button, IconLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/glass-panel";
import { BackIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ImageUploader, MIN_PHOTOS } from "@/components/profile/image-uploader";
import { BasicsFields, InterestsPicker, PreferencesFields, SocialsFields } from "@/components/profile/profile-fields";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex scroll-mt-24 flex-col gap-4">
      <SectionLabel id={`${id}-h`}>{title}</SectionLabel>
      {children}
    </section>
  );
}

export function ProfileEditor({ userId, initial, catalog }: { userId: string; initial: ProfileDraft; catalog: string[] }) {
  const [draft, setDraft] = useState(initial);
  const [removed, setRemoved] = useState<string[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const set = useCallback((patch: Partial<ProfileDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const save = () => {
    const found = validateFields(draft, ["name", "dateOfBirth", "gender", "year", "department", "bio", "interests", "interestedIn", "instagram", "whatsapp"]);
    setErrors(found);
    if (draft.photos.length < MIN_PHOTOS) return setFormError(`Add at least ${MIN_PHOTOS} photos.`);
    if (Object.keys(found).length) {
      setFormError("Check the highlighted fields.");
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    startTransition(async () => {
      setFormError(null);
      const result = await saveProfile(toPayload(draft), draft.photos);
      if (!result || "error" in result) return setFormError(result?.error ?? "Couldn’t save. Try again.");
      // Removed photos are deleted only now that the profile no longer points at them.
      if (removed.length) await createClient().storage.from(PHOTO_BUCKET).remove(removed);
      toast({ message: "Profile saved." });
      router.push("/profile");
      router.refresh();
    });
  };

  return (
    <main className="relative mx-auto min-h-dvh max-w-[560px] pb-[calc(120px+env(safe-area-inset-bottom))] lg:pb-32">
      <header className="pt-safe sticky top-0 z-20 bg-night/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-1 px-2">
          <IconLink href="/profile" label="Back to profile">
            <BackIcon />
          </IconLink>
          <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Edit profile</h1>
        </div>
      </header>

      <div className="flex flex-col gap-10 px-5 pt-4">
        <Section id="photos" title="Photos">
          <ImageUploader userId={userId} value={draft.photos} onChange={(photos) => set({ photos })} onRemove={(path) => setRemoved((r) => [...r, path])} onBusyChange={setUploading} />
        </Section>
        <Section id="basics" title="Basics">
          <BasicsFields draft={draft} set={set} errors={errors} />
        </Section>
        <Section id="interests" title="Interests">
          <InterestsPicker draft={draft} set={set} errors={errors} catalog={catalog} />
        </Section>
        <Section id="preferences" title="Discovery">
          <PreferencesFields draft={draft} set={set} errors={errors} />
        </Section>
        <Section id="socials" title="Socials">
          <SocialsFields draft={draft} set={set} errors={errors} />
        </Section>
      </div>

      <footer className="bottom-safe fixed inset-x-4 z-30 mx-auto max-w-[528px] lg:left-[276px]">
        <div className="glass flex items-center gap-3 rounded-[24px] p-2 pl-5 shadow-[0_20px_60px_rgba(0,0,0,.5)]">
          <p role={formError ? "alert" : undefined} className="m-0 flex-1 text-[13px] text-ink/60">
            {formError ? <span className="text-danger">{formError}</span> : dirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <Button size="sm" onClick={save} loading={pending} disabled={!dirty || uploading}>
            {uploading ? "Uploading…" : "Save"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
