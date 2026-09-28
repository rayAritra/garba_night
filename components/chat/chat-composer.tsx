"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { SendIcon } from "@/components/ui/icons";

const MAX = 1000;

/** Floating glass composer from Chat.html. 16px text so iOS never zooms on focus. */
export function ChatComposer({ onSend, disabled, onFocus }: { onSend: (text: string) => void; disabled?: boolean; onFocus?: () => void }) {
  const [draft, setDraft] = useState("");
  const empty = !draft.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (empty || disabled) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <form onSubmit={submit} className="glass flex h-14 items-center gap-2 rounded-full py-1.5 pr-1.5 pl-5 shadow-[0_16px_50px_rgba(0,0,0,.5)]">
      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <input
        id="composer"
        autoComplete="off"
        enterKeyHint="send"
        placeholder={disabled ? "This conversation has ended" : "Message…"}
        value={draft}
        maxLength={MAX}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={onFocus}
        className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none focus-visible:outline-none disabled:opacity-60"
      />
      {draft.length > MAX - 100 ? (
        <span aria-live="polite" className="text-[11px] text-ink/46 tabular-nums">
          {MAX - draft.length}
        </span>
      ) : null}
      <button
        type="submit"
        aria-label="Send"
        disabled={empty || disabled}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,opacity] duration-150 active:scale-90",
          empty ? "bg-white/8 text-ink/50" : "accent-gradient text-on-accent",
        )}
      >
        <SendIcon size={18} />
      </button>
    </form>
  );
}
