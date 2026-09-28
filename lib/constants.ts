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

/** The event every screen points at. Edit here to change what the app shows. */
export const EVENT = {
  name: "Garba Night",
  college: "MAKAUT",
  venue: "Maulana Abul Kalam Azad University of Technology",
  campus: "West Bengal",
  startsAt: "2026-10-30T19:00:00+05:30",
  timeZone: "Asia/Kolkata",
  dressCode: "Traditional",
};

/** Credit shown in the landing page footer. */
export const CREATOR = { name: "Aritra Ray", github: "https://github.com/rayAritra" };
