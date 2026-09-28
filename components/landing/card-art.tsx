import { cn } from "@/lib/utils";

/**
 * Decorative stage-light card with an abstract silhouette. Landing art only: it never stands in for
 * a real person, and the app itself always shows real uploaded photos.
 */
export function CardArt({ tone, className, children }: { tone: 1 | 2 | 3 | 4; className?: string; children?: React.ReactNode }) {
  return (
    <div aria-hidden="true" className={cn("absolute overflow-hidden border border-white/8", className)}>
      <div className={cn("absolute inset-0", `tone-${tone}`)}>
        <div className="absolute top-[20%] left-1/2 aspect-[1/1.18] w-[34%] -translate-x-1/2 rounded-full bg-[#150c0f] shadow-[inset_10px_8px_22px_rgba(255,170,90,.22),-8px_-6px_30px_rgba(255,160,70,.18)]" />
        <div className="absolute top-[52%] left-1/2 h-[70%] w-[88%] -translate-x-1/2 rounded-[48%_48%_0_0] bg-[#150c0f] shadow-[inset_14px_10px_30px_rgba(255,150,80,.16)]" />
      </div>
      {children}
    </div>
  );
}

export function Grain({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-[.07] mix-blend-overlay">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
