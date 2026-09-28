import { ExternalIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

/**
 * "Connect outside the app". Only rendered with values from `get_match_profile`, which returns a handle
 * solely when its owner enabled sharing and the match is active and unblocked.
 */
export function ConnectCard({ instagram, whatsapp }: { instagram: string | null; whatsapp: string | null }) {
  if (!instagram && !whatsapp) return null;
  return (
    <section aria-labelledby="connect-h" className="mt-[18px] mb-1 animate-rise rounded-[22px] border border-white/6 bg-white/2.5 px-1 py-1.5">
      <h3 id="connect-h" className="mx-3.5 mt-2.5 mb-1 text-xs font-semibold tracking-[0.08em] text-ink/50 uppercase">
        Connect outside the app
      </h3>
      {instagram ? (
        <a
          href={`https://instagram.com/${encodeURIComponent(instagram)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 rounded-[18px] px-3.5 py-3 no-underline hover:bg-white/3"
        >
          <span className="flex size-9 items-center justify-center rounded-sm bg-rose/14 text-[#FF8FAB]">
            <InstagramIcon size={18} />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">Instagram</span>
            <span className="text-[13px] text-ink/55">@{instagram}</span>
          </span>
          <ExternalIcon size={16} className="text-ink/50" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 rounded-[18px] border-t border-white/5 px-3.5 py-3 no-underline first-of-type:border-t-0 hover:bg-white/3"
        >
          <span className="flex size-9 items-center justify-center rounded-sm bg-[rgba(90,200,120,.12)] text-mint">
            <WhatsAppIcon size={18} />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">WhatsApp</span>
            <span className="text-[13px] text-ink/55">Continue chatting</span>
          </span>
          <ExternalIcon size={16} className="text-ink/50" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </section>
  );
}
