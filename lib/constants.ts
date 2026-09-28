export const INTERESTS = ["Garba", "Dance", "Music", "Movies", "Coding", "Gaming", "Food", "Travel", "Photography", "Sports", "Gym", "Anime", "Fashion", "Art", "Cricket", "Football", "F1", "Startups"] as const;
export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"] as const;
export const GENDERS = ["Man", "Woman", "Non-binary", "Prefer not to say"] as const;
/** Values stored in `profiles.interested_in`; `Everyone` is matched specially by `get_discover_profiles`. */
export const SHOW_ME = [
  { value: "Woman", label: "Women" },
  { value: "Man", label: "Men" },
  { value: "Non-binary", label: "Non-binary people" },
  { value: "Everyone", label: "Everyone" },
] as const;
export const MAX_INTERESTS = 5;
export const ICEBREAKERS = ["Garba skills from 1–10?", "What’s your go-to Garba song?", "Traditional fit ready?", "Food stalls or dance floor?"];

export const REPORT_REASONS = ["Fake profile", "Inappropriate content", "Harassment", "Spam", "Other"] as const;

const env = (value: string | undefined) => value?.trim() || undefined;

/**
 * The event every screen points at. Set these per deployment; unset optional fields are hidden
 * rather than shown as placeholders.
 */
export const EVENT = {
  name: env(process.env.NEXT_PUBLIC_EVENT_NAME) ?? "Garba Night",
  college: env(process.env.NEXT_PUBLIC_EVENT_COLLEGE),
  venue: env(process.env.NEXT_PUBLIC_EVENT_VENUE),
  campus: env(process.env.NEXT_PUBLIC_EVENT_CAMPUS),
  startsAt: env(process.env.NEXT_PUBLIC_EVENT_STARTS_AT) ?? "2026-10-12T19:00:00+05:30",
  timeZone: env(process.env.NEXT_PUBLIC_EVENT_TIMEZONE) ?? "Asia/Kolkata",
  dressCode: env(process.env.NEXT_PUBLIC_EVENT_DRESS_CODE) ?? "Traditional",
};
