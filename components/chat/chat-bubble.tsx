import type { ThreadMessage } from "@/lib/chat";
import { clockTime, cn } from "@/lib/utils";
import { RetryIcon } from "@/components/ui/icons";

/** One message. `last` marks the end of a same-sender run: it gets the tail corner and the footer line. */
export function ChatBubble({ message, mine, last, seen, onRetry }: { message: ThreadMessage; mine: boolean; last: boolean; seen?: boolean; onRetry?: () => void }) {
  const failed = message.status === "failed";
  const sending = message.status === "sending";
  return (
    <li className={cn("flex animate-msg flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[76%] px-[15px] py-[11px] text-[15px] leading-[1.45] break-words whitespace-pre-wrap text-[#F7F3EE] [overflow-wrap:anywhere] lg:max-w-[60%]",
          mine ? "mine-gradient" : "border border-white/6 bg-hover",
          mine ? (last ? "rounded-[20px_20px_6px_20px]" : "rounded-[20px]") : last ? "rounded-[20px_20px_20px_6px]" : "rounded-[20px]",
          sending && "opacity-70",
          failed && "opacity-60 ring-1 ring-danger/60",
        )}
      >
        <span className="sr-only">{mine ? "You: " : "Them: "}</span>
        {message.content}
      </div>
      {failed ? (
        <button type="button" onClick={onRetry} className="mx-1 mt-1 flex min-h-11 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-danger hover:bg-rose/10">
          <RetryIcon size={14} />
          Not sent · Tap to retry
        </button>
      ) : last || sending ? (
        <span className="mx-1.5 mt-1 mb-1.5 text-[11px] text-ink/38">
          {sending ? "Sending…" : mine && seen ? `Seen · ${clockTime(message.created_at)}` : clockTime(message.created_at)}
        </span>
      ) : null}
    </li>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <li aria-hidden="false" className="my-3 flex justify-center">
      <span className="rounded-full bg-white/4 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-ink/46">{label}</span>
    </li>
  );
}
