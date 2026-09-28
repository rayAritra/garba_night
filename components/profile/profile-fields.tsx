"use client";

import { useId, type ReactNode } from "react";
import { GENDERS, MAX_INTERESTS, SHOW_ME, YEARS } from "@/lib/constants";
import { adultCutoff, type FieldErrors, type ProfileDraft } from "@/lib/profile-draft";
import { cn } from "@/lib/utils";
import { InterestChip } from "@/components/ui/chip";
import { FormField, Switch, TextAreaField } from "@/components/ui/form-field";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

type Props = { draft: ProfileDraft; set: (patch: Partial<ProfileDraft>) => void; errors: FieldErrors };

/** Chips backed by real radio/checkbox inputs, so they group and announce correctly. */
function ChoiceChips({ legend, options, value, multiple, onChange, error }: {
  legend: string;
  options: readonly { value: string; label: string }[];
  value: string[];
  multiple?: boolean;
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const name = useId();
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby={error ? `${name}-err` : undefined}>
      <legend className="mb-2 text-[13px] font-semibold text-ink/70">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "inline-flex h-11 cursor-pointer items-center rounded-full px-[18px] text-[15px] font-semibold transition-[background-color,border-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-saffron",
                checked ? "border border-saffron/60 bg-saffron/14 text-saffron-soft shadow-[0_0_24px_rgba(255,160,60,.18)]" : "border border-white/8 bg-surface text-ink/78 hover:bg-hover",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(multiple ? (checked ? value.filter((v) => v !== option.value) : [...value, option.value]) : [option.value])}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${name}-err`} className="m-0 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

const asOptions = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

export function BasicsFields({ draft, set, errors }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="First name" autoComplete="given-name" value={draft.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
      <FormField
        label="Date of birth"
        type="date"
        max={adultCutoff()}
        min="1950-01-01"
        value={draft.dateOfBirth}
        onChange={(e) => set({ dateOfBirth: e.target.value })}
        error={errors.dateOfBirth}
        hint="Only your age is shown. Your birthday stays private."
        className="[color-scheme:dark]"
      />
      <ChoiceChips legend="I am" options={asOptions(GENDERS)} value={draft.gender ? [draft.gender] : []} onChange={([g]) => set({ gender: g })} error={errors.gender} />
      <ChoiceChips legend="Year" options={YEARS.map((y) => ({ value: y, label: y.replace(" Year", "") }))} value={draft.year ? [draft.year] : []} onChange={([y]) => set({ year: y })} error={errors.year} />
      <FormField label="Department" optional placeholder="CSE, Design, Commerce…" value={draft.department} maxLength={80} onChange={(e) => set({ department: e.target.value })} error={errors.department} />
      <TextAreaField
        label="Bio"
        placeholder="Garba skills, dance-floor plans, food-stall strategy…"
        value={draft.bio}
        maxLength={200}
        rows={3}
        onChange={(e) => set({ bio: e.target.value })}
        error={errors.bio}
        hint={`${draft.bio.trim().length}/200`}
      />
    </div>
  );
}

export function InterestsPicker({ draft, set, errors, catalog }: Props & { catalog: string[] }) {
  const picked = draft.interests;
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Interests" className="flex flex-wrap gap-2.5">
        {catalog.map((label) => {
          const on = picked.includes(label);
          return (
            <InterestChip
              key={label}
              selected={on}
              disabled={!on && picked.length >= MAX_INTERESTS}
              onClick={() => set({ interests: on ? picked.filter((x) => x !== label) : [...picked, label] })}
            >
              {label}
            </InterestChip>
          );
        })}
      </div>
      <p aria-live="polite" className={cn("m-0 text-center text-[13px] font-semibold", errors.interests ? "text-danger" : "text-ink/50")}>
        {errors.interests ?? `${picked.length} of ${MAX_INTERESTS} picked`}
      </p>
    </div>
  );
}

export function PreferencesFields({ draft, set, errors }: Props) {
  return (
    <ChoiceChips
      legend="Show me"
      multiple
      options={SHOW_ME}
      value={draft.interestedIn}
      error={errors.interestedIn}
      onChange={(next) => {
        // "Everyone" is exclusive: picking it clears the rest, picking anything else clears it.
        const added = next.find((v) => !draft.interestedIn.includes(v));
        set({ interestedIn: added === "Everyone" ? ["Everyone"] : next.filter((v) => v !== "Everyone") });
      }}
    />
  );
}

function SocialRow({ icon, children, shareLabel, share, onShare, canShare }: { icon: ReactNode; children: ReactNode; shareLabel: string; share: boolean; onShare: (v: boolean) => void; canShare: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-panel p-4">
      <div className="flex items-start gap-3">
        <span className="mt-8 flex size-9 shrink-0 items-center justify-center rounded-sm bg-white/6 text-ink/80">{icon}</span>
        <div className="flex-1">{children}</div>
      </div>
      <div className="flex items-center gap-3">
        <span id={id} className="flex-1 text-sm text-ink/70">
          {shareLabel}
        </span>
        <Switch checked={share && canShare} disabled={!canShare} onChange={onShare} labelledBy={id} />
      </div>
    </div>
  );
}

export function SocialsFields({ draft, set, errors }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <SocialRow
        icon={<InstagramIcon size={18} />}
        shareLabel="Show to my matches"
        share={draft.shareInstagram}
        canShare={Boolean(draft.instagram.trim())}
        onShare={(v) => set({ shareInstagram: v })}
      >
        <FormField label="Instagram" optional autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="username" value={draft.instagram} maxLength={31} onChange={(e) => set({ instagram: e.target.value })} error={errors.instagram} />
      </SocialRow>
      <SocialRow
        icon={<WhatsAppIcon size={18} />}
        shareLabel="Show to my matches"
        share={draft.shareWhatsapp}
        canShare={Boolean(draft.whatsapp.trim())}
        onShare={(v) => set({ shareWhatsapp: v })}
      >
        <FormField label="WhatsApp" optional type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" value={draft.whatsapp} maxLength={20} onChange={(e) => set({ whatsapp: e.target.value })} error={errors.whatsapp} />
      </SocialRow>
      <p className="m-0 px-1 text-[13px] leading-normal text-ink/46">Private by default. Only people you’ve matched with can see what you choose to share — never anyone in Discover.</p>
    </div>
  );
}
