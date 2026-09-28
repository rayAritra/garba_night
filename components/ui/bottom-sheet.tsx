"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Modal bottom sheet on a native <dialog>: focus trap, Escape and inert background come from the platform.
 * Tapping the dimmed backdrop closes it.
 */
export function BottomSheet({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-x-2 top-auto bottom-[max(8px,env(safe-area-inset-bottom))] m-0 mx-auto max-h-[85dvh] w-auto max-w-[440px] overflow-y-auto rounded-[28px] border border-white/8 bg-[rgba(20,20,24,.9)] p-0 pt-2 pb-3 text-ink shadow-[0_-20px_60px_rgba(0,0,0,.5)] backdrop-blur-[30px] backdrop-saturate-[140%]",
        "open:animate-[sheet-up_.3s_cubic-bezier(.2,.9,.3,1)_both] backdrop:bg-black/60 backdrop:backdrop-blur-[4px]",
        className,
      )}
    >
      {/* Inner wrapper so clicks on content never count as backdrop clicks. */}
      <div>
        <div aria-hidden="true" className="mx-auto mt-1 mb-3.5 h-1 w-9 rounded-sm bg-white/20" />
        <h2 id={titleId} className="mx-5 mt-0 mb-2.5 text-[13px] font-semibold tracking-[0.08em] text-ink/50 uppercase">
          {title}
        </h2>
        {open ? children : null}
      </div>
    </dialog>
  );
}

/** Full-width sheet option row (56px) with icon tile, label and optional hint. */
export function SheetOption({ icon, label, hint, danger, onClick, disabled }: { icon: ReactNode; label: string; hint?: string; danger?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("flex min-h-14 w-full items-center gap-3.5 px-5 py-2 text-left text-base font-semibold transition-colors hover:bg-white/4 focus-visible:outline-offset-[-2px] disabled:opacity-50", danger ? "text-danger" : "text-ink")}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-sm", danger ? "bg-rose/14" : "bg-white/6")}>{icon}</span>
      <span className="flex flex-col gap-0.5">
        {label}
        {hint ? <span className={cn("text-[13px] font-normal", danger ? "text-[rgba(255,160,180,.6)]" : "text-ink/50")}>{hint}</span> : null}
      </span>
    </button>
  );
}
