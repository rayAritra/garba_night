import { z } from "zod";

const adultDate = z.string().refine((value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return date <= cutoff;
}, "You must be 18 or older");

export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60), dateOfBirth: adultDate,
  gender: z.enum(["Man", "Woman", "Non-binary", "Prefer not to say"]),
  interestedIn: z.array(z.string()).min(1).max(4), year: z.string().min(1).max(20),
  department: z.string().trim().max(80), bio: z.string().trim().min(10).max(200),
  interests: z.array(z.string()).min(1).max(6),
  instagram: z.string().trim().max(30).regex(/^$|^[A-Za-z0-9._]+$/, "Enter a valid username"),
  whatsapp: z.string().trim().max(16).regex(/^$|^\+?[1-9]\d{7,14}$/, "Use international format"),
  shareInstagram: z.boolean(), shareWhatsapp: z.boolean(),
});

export const messageSchema = z.string().trim().min(1).max(1000);
