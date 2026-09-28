import { profileSchema } from "@/lib/validation";
import type { OwnProfile } from "@/lib/types";
import { MAX_INTERESTS } from "@/lib/constants";

/** Everything `saveProfile` needs, as edited by onboarding and profile/edit. */
export type ProfileDraft = {
  name: string;
  dateOfBirth: string;
  gender: string;
  interestedIn: string[];
  year: string;
  department: string;
  bio: string;
  interests: string[];
  instagram: string;
  whatsapp: string;
  shareInstagram: boolean;
  shareWhatsapp: boolean;
  photos: string[];
};

export type DraftField = Exclude<keyof ProfileDraft, "photos">;
export type FieldErrors = Partial<Record<DraftField, string>>;

export function draftFromProfile(profile: OwnProfile): ProfileDraft {
  return {
    name: profile.name,
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    interestedIn: profile.interestedIn,
    year: profile.year ?? "",
    department: profile.department ?? "",
    bio: profile.bio ?? "",
    interests: profile.interests.slice(0, MAX_INTERESTS),
    instagram: profile.instagram ?? "",
    whatsapp: profile.whatsapp ?? "",
    shareInstagram: profile.shareInstagram,
    shareWhatsapp: profile.shareWhatsapp,
    photos: profile.photos,
  };
}

/** Normalises free-typed handles: "@name" → "name", "+91 98765 43210" → "+919876543210". */
export function toPayload(draft: ProfileDraft) {
  const { photos, ...fields } = draft;
  void photos;
  const instagram = fields.instagram.trim().replace(/^@/, "");
  const whatsapp = fields.whatsapp.replace(/[\s()-]/g, "");
  return { ...fields, instagram, whatsapp, shareInstagram: fields.shareInstagram && Boolean(instagram), shareWhatsapp: fields.shareWhatsapp && Boolean(whatsapp) };
}

const FRIENDLY: Record<DraftField, string> = {
  name: "Add your name (2–60 letters).",
  dateOfBirth: "You need to be 18 or older.",
  gender: "Pick one.",
  interestedIn: "Pick who you’d like to see.",
  year: "Pick your year.",
  department: "Keep it under 80 characters.",
  bio: "Write 10–200 characters about yourself.",
  interests: `Pick 1–${MAX_INTERESTS} interests.`,
  instagram: "Letters, numbers, dots and underscores only.",
  whatsapp: "Use international format, like +919876543210.",
  shareInstagram: "",
  shareWhatsapp: "",
};

/** Validate with the same schema the server action enforces, reporting only the given fields. */
export function validateFields(draft: ProfileDraft, fields: DraftField[]): FieldErrors {
  const errors: FieldErrors = {};
  const result = profileSchema.safeParse(toPayload(draft));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as DraftField;
      if (fields.includes(field) && !errors[field]) errors[field] = field === "dateOfBirth" && !draft.dateOfBirth ? "Add your date of birth." : FRIENDLY[field];
    }
  }
  if (fields.includes("interests") && draft.interests.length > MAX_INTERESTS) errors.interests = FRIENDLY.interests;
  return errors;
}

/** Latest date of birth that is 18+ today, for the date input's `max`. */
export function adultCutoff(today = new Date()) {
  const cutoff = new Date(today);
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;
}
