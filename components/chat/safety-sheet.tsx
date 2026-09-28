"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReport } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BottomSheet, SheetOption } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { BlockIcon, FlagIcon, UnmatchIcon } from "@/components/ui/icons";
import { useInbox } from "@/components/layout/inbox-provider";
import { useToast } from "@/components/ui/toast";

type Step = "menu" | "unmatch" | "block" | "report";

/** Sheet.html: unmatch / block / report for one conversation. */
export function SafetySheet({ open, onClose, matchId, profileId, name }: { open: boolean; onClose: () => void; matchId: string; profileId: string; name: string }) {
  const [step, setStep] = useState<Step>("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useInbox();

  const close = () => {
    onClose();
    setStep("menu");
    setReason(null);
    setDetails("");
    setError(null);
  };

  const leave = (message: string) => {
    close();
    toast({ message });
    void refresh();
    router.replace("/messages");
  };

  const unmatch = () =>
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("unmatch", { p_match: matchId });
      if (rpcError) return setError("Couldn’t unmatch. Try again.");
      leave(`You unmatched ${name}.`);
    });

  const block = () =>
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("block_profile", { p_profile: profileId });
      if (rpcError) return setError("Couldn’t block. Try again.");
      leave(`${name} is blocked.`);
    });

  const report = () =>
    startTransition(async () => {
      if (!reason) return setError("Pick a reason.");
      const result = await submitReport(profileId, reason, details.trim());
      if ("error" in result && result.error) return setError("Couldn’t send the report. Try again.");
      if (alsoBlock) {
        const { error: rpcError } = await createClient().rpc("block_profile", { p_profile: profileId });
        if (!rpcError) return leave("Report sent. They’re blocked and can’t contact you.");
      }
      close();
      toast({ message: "Report sent. Thanks for keeping the floor safe." });
    });

  const title = step === "menu" ? name : step === "unmatch" ? `Unmatch ${name}?` : step === "block" ? `Block ${name}?` : `Report ${name}`;

  return (
    <BottomSheet open={open} onClose={close} title={title}>
      {step === "menu" ? (
        <>
          <SheetOption icon={<UnmatchIcon size={18} />} label="Unmatch" hint="Ends the chat for both of you" onClick={() => setStep("unmatch")} />
          <SheetOption icon={<BlockIcon size={18} />} label="Block" hint="They won’t see you again" onClick={() => setStep("block")} />
          <SheetOption icon={<FlagIcon size={18} />} label="Report" hint="Tell us what happened. It stays private." danger onClick={() => setStep("report")} />
          <div className="px-3 pt-2.5">
            <Button variant="quiet" size="md" block onClick={close}>
              Cancel
            </Button>
          </div>
        </>
      ) : step === "report" ? (
        <div className="flex flex-col gap-4 px-5 pb-1">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-[15px] text-ink/70">What happened?</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 text-[15px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-saffron",
                  reason === r ? "border-saffron/60 bg-saffron/10 text-saffron-soft" : "border-white/8 bg-surface text-ink/85",
                )}
              >
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
                <span aria-hidden="true" className={cn("size-4 rounded-full border-2", reason === r ? "border-saffron bg-saffron shadow-[inset_0_0_0_3px_#16161a]" : "border-ink/40")} />
                {r}
              </label>
            ))}
          </fieldset>
          <TextAreaField label="Anything else?" optional maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Only our team sees this." rows={3} />
          <label className="flex min-h-11 items-center gap-3 text-[15px]">
            <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="size-5 accent-saffron" />
            Also block {name}
          </label>
          {error ? <p role="alert" className="m-0 text-[13px] text-danger">{error}</p> : null}
          <div className="flex gap-2.5">
            <Button variant="quiet" size="md" className="flex-1" onClick={() => setStep("menu")}>
              Back
            </Button>
            <Button variant="danger" size="md" className="flex-1" loading={pending} onClick={report}>
              Send report
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-1">
          <p className="m-0 text-[15px] leading-normal text-ink/70">
            {step === "unmatch"
              ? `The conversation ends for both of you and ${name} leaves your matches. This can’t be undone.`
              : `${name} won’t see you in Discover and can’t message you. You can unblock them later in Settings.`}
          </p>
          {error ? <p role="alert" className="m-0 text-[13px] text-danger">{error}</p> : null}
          <div className="flex gap-2.5">
            <Button variant="quiet" size="md" className="flex-1" onClick={() => setStep("menu")}>
              Back
            </Button>
            <Button variant="danger" size="md" className="flex-1" loading={pending} onClick={step === "unmatch" ? unmatch : block}>
              {step === "unmatch" ? "Unmatch" : "Block"}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
