import { CREATOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

const instagramUrl = `https://instagram.com/${CREATOR.instagram}`;
const whatsappUrl = `https://wa.me/${CREATOR.phone.replace(/\D/g, "")}`;

const linkClass = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 font-semibold text-ink/80 no-underline transition-colors hover:text-saffron";

/** Instagram + phone links for the maker. */
function Contacts({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center justify-center gap-x-1", className)}>
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <InstagramIcon size={16} className="text-[#FF8FAB]" />@{CREATOR.instagram}
        <span className="sr-only">on Instagram (opens in a new tab)</span>
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <WhatsAppIcon size={16} className="text-mint" />
        {CREATOR.phoneLabel}
        <span className="sr-only">on WhatsApp (opens in a new tab)</span>
      </a>
    </span>
  );
}

/**
 * "Made by Aritra Ray" credit.
 * - `card`: a glowing panel with name + Instagram + WhatsApp (landing, profile, settings).
 * - `pill`: compact glass badge (auth screens, desktop sidebar).
 */
export function CreatorCredit({ variant = "card", className }: { variant?: "card" | "pill"; className?: string }) {
  if (variant === "pill") {
    return (
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[13px] text-ink/70 no-underline transition-colors hover:border-saffron/40 hover:text-ink",
          className,
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-saffron shadow-[0_0_10px_rgba(255,181,71,.9)]" />
        Made by <span className="font-bold text-saffron">{CREATOR.name}</span>
        <span className="text-ink/50">· @{CREATOR.instagram}</span>
        <span className="sr-only">(Instagram, opens in a new tab)</span>
      </a>
    );
  }
  return (
    <section
      aria-label={`Made by ${CREATOR.name}`}
      className={cn(
        "relative flex flex-col items-center gap-2 overflow-hidden rounded-[22px] border border-saffron/25 bg-saffron/6 px-5 py-5 text-center shadow-[0_0_60px_rgba(255,160,60,.12)]",
        className,
      )}
    >
      <p className="m-0 text-xs font-semibold tracking-[0.14em] text-ink/50 uppercase">Designed &amp; built by</p>
      <p className="m-0 text-2xl font-extrabold tracking-[-0.03em]">
        {CREATOR.name.split(" ")[0]} <span className="serif text-[28px] text-saffron">{CREATOR.name.split(" ").slice(1).join(" ")}</span>
      </p>
      <Contacts className="text-sm" />
    </section>
  );
}
