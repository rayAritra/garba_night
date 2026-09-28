import type { Metadata } from "next";
import { getViewer } from "@/lib/profile";
import { ageFromDate } from "@/lib/utils";
import { ButtonLink, IconLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/chip";
import { GlowOrb, SectionLabel } from "@/components/ui/glass-panel";
import { EditIcon, GearIcon } from "@/components/ui/icons";
import { ProfilePreview } from "@/components/profile/profile-preview";
import { CreatorCredit } from "@/components/ui/creator-credit";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await getViewer();
  const shared = [viewer.shareInstagram && viewer.instagram && "Instagram", viewer.shareWhatsapp && viewer.whatsapp && "WhatsApp"].filter(Boolean);

  return (
    <main className="pb-nav relative isolate mx-auto min-h-dvh max-w-[480px] overflow-hidden lg:pt-6">
      <GlowOrb className="top-[120px] left-1/2 -ml-[260px] size-[520px]" style={{ background: "radial-gradient(circle, rgba(245,140,40,.16), transparent 62%)" }} />
      <header className="pt-safe flex h-16 items-center justify-between pr-3 pl-5">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.03em]">Profile</h1>
        <IconLink href="/settings" label="Settings" className="text-ink/85">
          <GearIcon size={21} />
        </IconLink>
      </header>

      <div className="flex flex-col gap-3 px-4">
        <SectionLabel as="p" className="px-1 text-[13px]">
          How people see you
        </SectionLabel>
        <ProfilePreview
          profile={{
            id: viewer.id,
            name: viewer.name,
            age: viewer.dateOfBirth ? ageFromDate(viewer.dateOfBirth) : null,
            department: viewer.department,
            year: viewer.year,
            bio: viewer.bio,
            photos: viewer.photos,
            interests: viewer.interests,
          }}
        />
      </div>

      <section className="mt-[18px] flex flex-col gap-3.5 px-5">
        {viewer.bio ? <p className="m-0 text-[15px] leading-normal text-ink/84">{viewer.bio}</p> : null}
        {viewer.interests.length ? (
          <ul aria-label="Interests" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {viewer.interests.map((interest, i) => (
              <li key={interest}>
                <Tag variant={i === 0 ? "selected" : "default"} className="h-[30px] text-[13px]">
                  {interest}
                </Tag>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="m-0 text-[13px] text-ink/46">{shared.length ? `Matches can see your ${shared.join(" and ")}.` : "Your socials are hidden from everyone."}</p>
        <ButtonLink href="/profile/edit" variant="secondary" size="md" block className="mt-1 font-bold">
          <EditIcon size={17} />
          Edit profile
        </ButtonLink>
        <CreatorCredit className="mt-4" />
      </section>
    </main>
  );
}
