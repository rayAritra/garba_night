import { describe, expect, it } from "vitest";
import { adultCutoff, toPayload, validateFields, type ProfileDraft } from "@/lib/profile-draft";

const draft: ProfileDraft = {
  name: "Aarav",
  dateOfBirth: "2003-05-01",
  gender: "Man",
  interestedIn: ["Woman"],
  year: "3rd Year",
  department: "ECE",
  bio: "Garba 8/10 on a good night.",
  interests: ["Garba", "F1"],
  instagram: "@aarav.frames",
  whatsapp: "+91 98765 43210",
  shareInstagram: true,
  shareWhatsapp: true,
  photos: ["u/1.webp", "u/2.webp"],
};

describe("profile draft", () => {
  it("normalises socials the way the database constraints expect", () => {
    const payload = toPayload(draft);
    expect(payload.instagram).toBe("aarav.frames");
    expect(payload.whatsapp).toBe("+919876543210");
    expect("photos" in payload).toBe(false);
  });

  it("never marks an empty handle as shared", () => {
    const payload = toPayload({ ...draft, instagram: "", whatsapp: " " });
    expect(payload.shareInstagram).toBe(false);
    expect(payload.shareWhatsapp).toBe(false);
  });

  it("validates only the requested step's fields", () => {
    const bad = { ...draft, bio: "short", interests: [] };
    expect(validateFields(bad, ["name", "bio"])).toEqual({ bio: expect.any(String) });
    expect(validateFields(bad, ["interests"])).toEqual({ interests: expect.any(String) });
    expect(validateFields(draft, ["name", "dateOfBirth", "gender", "year", "bio", "interests", "interestedIn", "instagram", "whatsapp"])).toEqual({});
  });

  it("rejects under-18 birthdays and caps interests at five", () => {
    expect(validateFields({ ...draft, dateOfBirth: new Date().toISOString().slice(0, 10) }, ["dateOfBirth"]).dateOfBirth).toBeTruthy();
    expect(validateFields({ ...draft, interests: ["a", "b", "c", "d", "e", "f"] }, ["interests"]).interests).toBeTruthy();
  });

  it("computes the 18+ cutoff for the date picker", () => {
    expect(adultCutoff(new Date(2026, 8, 28))).toBe("2008-09-28");
  });
});
