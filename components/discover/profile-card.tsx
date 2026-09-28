import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/chip";
import { Photo } from "@/components/ui/photo";

export const CARD_SIZES = "(min-width: 1024px) 460px, (min-width: 480px) 448px, 100vw";

export type CardProfile = {
  id: string;
  name: string;
  age: number | null;
  department: string | null;
  year: string | null;
  bio: string | null;
  photos: string[];
  interests: string[];
};

export function metaLine(profile: Pick<CardProfile, "department" | "year">) {
  return [profile.department, profile.year?.replace(" Year", " year")].filter(Boolean).join(" · ");
}

/** Segmented photo indicator + the current photo. Segments double as direct photo buttons. */
export function PhotoCarousel({
  profile,
  index,
  onSelect,
  priority,
}: {
  profile: Pick<CardProfile, "id" | "name" | "photos">;
  index: number;
  onSelect?: (index: number) => void;
  priority?: boolean;
}) {
  const count = Math.max(profile.photos.length, 1);
  return (
    <>
      {/* Every photo stays mounted so switching is instant once loaded. */}
      {(profile.photos.length ? profile.photos : [null]).map((path, i) => (
        <Photo
          key={path ?? i}
          path={path}
          alt={i === index ? `${profile.name}, photo ${i + 1} of ${count}` : ""}
          seed={profile.id}
          sizes={CARD_SIZES}
          priority={priority && i === 0}
          className={cn("text-7xl transition-opacity duration-200", i === index ? "opacity-100" : "opacity-0")}
        />
      ))}
      {count > 1 ? (
        <div className="absolute inset-x-3.5 top-3 z-10 flex gap-[5px]">
          {Array.from({ length: count }, (_, i) =>
            onSelect ? (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(i);
                }}
                onPointerDownCapture={(event) => event.stopPropagation()}
                // 3px bar, 44px-tall hit area.
                className="relative h-[3px] flex-1 rounded-sm before:absolute before:inset-x-0 before:-top-3 before:h-11 before:content-['']"
                style={{ background: i === index ? "#F4F1EC" : "rgba(244,241,236,.3)" }}
              />
            ) : (
              <span key={i} aria-hidden="true" className="h-[3px] flex-1 rounded-sm" style={{ background: i === index ? "#F4F1EC" : "rgba(244,241,236,.3)" }} />
            ),
          )}
        </div>
      ) : null}
    </>
  );
}

/** The visual card from Discover.html: photo, gradients, name/age, meta, tags, bio. */
export function ProfileCard({ profile, photoIndex, onSelectPhoto, priority, overlay, compact, className }: {
  profile: CardProfile;
  photoIndex: number;
  onSelectPhoto?: (index: number) => void;
  priority?: boolean;
  overlay?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const meta = metaLine(profile);
  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-card bg-surface", className)}>
      <PhotoCarousel profile={profile} index={photoIndex} onSelect={onSelectPhoto} priority={priority} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-card shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[90px] bg-linear-to-b from-night/45 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px]" style={{ background: "linear-gradient(0deg, rgba(5,5,5,.96) 18%, rgba(5,5,5,.6) 52%, transparent)" }} />
      {overlay}
      <div className={cn("pointer-events-none absolute flex flex-col gap-2.5", compact ? "inset-x-5 bottom-5" : "inset-x-[22px] bottom-[22px] lg:inset-x-7 lg:bottom-7")}>
        <div className="flex items-baseline gap-2.5">
          <h2 className={cn("m-0 font-extrabold tracking-[-0.03em]", compact ? "text-[30px]" : "text-[32px] lg:text-4xl")}>{profile.name}</h2>
          {profile.age ? <span className={cn("font-normal text-ink/80", compact ? "text-2xl" : "text-[26px] lg:text-[28px]")}>{profile.age}</span> : null}
        </div>
        {meta ? <p className="m-0 -mt-1 text-sm font-medium text-ink/66 lg:text-[15px]">{meta}</p> : null}
        {profile.interests.length ? (
          <ul aria-label="Interests" className="m-0 mt-0.5 flex list-none flex-wrap gap-1.5 p-0">
            {profile.interests.slice(0, 5).map((interest) => (
              <li key={interest}>
                <Tag>{interest}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
        {profile.bio ? <p className="m-0 mt-0.5 line-clamp-3 text-[15px] leading-[1.45] text-ink/84 lg:text-base">{profile.bio}</p> : null}
      </div>
    </div>
  );
}
