import Image, { getImageProps } from "next/image";
import { photoUrl } from "@/lib/photos";
import { cn, initials } from "@/lib/utils";

const TONES = ["tone-1", "tone-2", "tone-3", "tone-4"];

/** Stable warm gradient per person, used when a photo is missing or still loading. */
export function toneFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

type PhotoProps = {
  path: string | null | undefined;
  alt: string;
  seed: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Rendered over the gradient when there is no photo. */
  fallbackLabel?: string;
};

/** Fills its (relative) parent with a storage photo, falling back to a gradient + initials. */
export function Photo({ path, alt, seed, sizes, priority, className, imgClassName, fallbackLabel }: PhotoProps) {
  const src = photoUrl(path);
  return (
    <div className={cn("absolute inset-0 overflow-hidden", toneFor(seed), className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} draggable={false} className={cn("object-cover select-none", imgClassName)} />
      ) : (
        <span aria-hidden={!fallbackLabel} className="absolute inset-0 flex items-center justify-center font-extrabold tracking-[-0.03em] text-ink/70">
          {fallbackLabel ?? initials(alt)}
        </span>
      )}
    </div>
  );
}

/** Warm the browser cache with exactly the srcset candidate a <Photo> of these `sizes` will request. */
export function prefetchPhoto(path: string | null | undefined, sizes: string) {
  const src = photoUrl(path);
  if (!src || typeof window === "undefined") return;
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  const img = new window.Image();
  img.decoding = "async";
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
}

export function Avatar({ path, name, seed, size = 56, className, priority }: { path: string | null | undefined; name: string; seed: string; size?: number; className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      <Photo path={path} alt={name} seed={seed} sizes={`${size}px`} priority={priority} fallbackLabel={initials(name)} />
    </span>
  );
}

/** Avatar inside a saffron→rose ring; `glow` for the freshest matches, `quiet` for older ones. */
export function AvatarRing({ path, name, seed, size = 72, variant = "warm", glow }: { path: string | null | undefined; name: string; seed: string; size?: number; variant?: "warm" | "quiet"; glow?: boolean }) {
  return (
    <span
      className={cn("block shrink-0 rounded-full p-[2.5px]", variant === "warm" ? "ring-gradient" : "bg-white/14", glow && "shadow-[0_0_24px_rgba(224,64,106,.4)]")}
      style={{ width: size, height: size }}
    >
      <span className="block size-full rounded-full bg-night p-[2.5px]">
        <Avatar path={path} name={name} seed={seed} size={size - 10} className="size-full" />
      </span>
    </span>
  );
}
