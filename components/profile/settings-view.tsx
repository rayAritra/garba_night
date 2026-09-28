"use client";

import Link from "next/link";
import { useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions";
import { SHOW_ME } from "@/lib/constants";
import { PHOTO_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, IconLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/form-field";
import { BackIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

export type BlockedProfile = { id: string; name: string | null };

type Props = {
  userId: string;
  email: string;
  interestedIn: string[];
  isActive: boolean;
  instagram: string | null;
  whatsapp: string | null;
  shareInstagram: boolean;
  shareWhatsapp: boolean;
  photos: string[];
  blocked: BlockedProfile[];
};

const rowClass = "flex min-h-12 items-center gap-3 px-4 text-[15px] no-underline [&+&]:border-t [&+&]:border-white/5 focus-visible:outline-offset-[-2px]";

function Group({ id, title, children }: { id?: string; title?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={title ? `${id ?? title}-h` : undefined} className="scroll-mt-20">
      {title ? (
        <h2 id={`${id ?? title}-h`} className="mx-4 mt-0 mb-2 text-xs font-semibold tracking-[0.08em] text-ink/46 uppercase">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-[18px] bg-panel">{children}</div>
    </section>
  );
}

function LinkRow({ href, label, value }: { href: string; label: string; value?: string }) {
  return (
    <Link href={href} className={cn(rowClass, "hover:bg-white/3")}>
      <span className="flex-1">{label}</span>
      {value ? <span className="max-w-[55%] truncate text-sm text-ink/50">{value}</span> : null}
      <ChevronRightIcon size={16} className="shrink-0 text-ink/40" />
    </Link>
  );
}

function SwitchRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className={rowClass}>
      <span id={id} className="flex flex-1 flex-col gap-0.5 py-2">
        {label}
        {hint ? <span className="text-xs text-ink/46">{hint}</span> : null}
      </span>
      <Switch checked={checked} onChange={onChange} labelledBy={id} disabled={disabled} />
    </div>
  );
}

export function SettingsView(props: Props) {
  const supabase = createClient();
  const toast = useToast();
  const router = useRouter();
  const [prefs, setPrefs] = useState({ isActive: props.isActive, shareInstagram: props.shareInstagram, shareWhatsapp: props.shareWhatsapp });
  const [blocked, setBlocked] = useState(props.blocked);
  const [showBlocked, setShowBlocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const showMe = props.interestedIn.includes("Everyone") ? "Everyone" : SHOW_ME.filter((o) => props.interestedIn.includes(o.value)).map((o) => o.label).join(", ") || "Not set";

  const update = async (patch: Partial<typeof prefs>) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, ...patch }));
    const row: Record<string, boolean> = {};
    if (patch.isActive !== undefined) row.is_active = patch.isActive;
    if (patch.shareInstagram !== undefined) row.share_instagram = patch.shareInstagram;
    if (patch.shareWhatsapp !== undefined) row.share_whatsapp = patch.shareWhatsapp;
    const { error } = await supabase.from("profiles").update(row).eq("id", props.userId);
    if (error) {
      setPrefs(previous);
      toast({ tone: "error", message: "Couldn’t save that setting. Try again." });
    } else {
      router.refresh();
    }
  };

  const unblock = async (person: BlockedProfile) => {
    const { error } = await supabase.from("blocks").delete().eq("blocker_id", props.userId).eq("blocked_id", person.id);
    if (error) return toast({ tone: "error", message: "Couldn’t unblock. Try again." });
    setBlocked((list) => list.filter((b) => b.id !== person.id));
    toast({ message: `${person.name ?? "They"} can find you in Discover again.` });
  };

  const deleteAccount = () =>
    startDelete(async () => {
      if (props.photos.length) await supabase.storage.from(PHOTO_BUCKET).remove(props.photos);
      const { error } = await supabase.rpc("delete_my_account");
      if (error) {
        toast({ tone: "error", message: "Couldn’t delete your account. Try again." });
        return;
      }
      await supabase.auth.signOut().catch(() => {});
      router.replace("/");
      router.refresh();
    });

  return (
    <main className="pb-nav mx-auto min-h-dvh max-w-[560px] lg:pt-6">
      <header className="pt-safe flex h-16 items-center gap-1 px-2">
        <IconLink href="/profile" label="Back to profile">
          <BackIcon />
        </IconLink>
        <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">Settings</h1>
      </header>

      <div className="flex flex-col gap-[22px] px-4 pt-1">
        <Group id="account" title="Account">
          <div className={rowClass}>
            <span className="flex-1">Email</span>
            <span className="max-w-[60%] truncate text-sm text-ink/50">{props.email}</span>
          </div>
          <LinkRow href="/reset-password" label="Change password" />
        </Group>

        <Group id="discovery" title="Discovery">
          <LinkRow href="/profile/edit#preferences" label="Show me" value={showMe} />
          <SwitchRow label="Pause discovery" hint={prefs.isActive ? undefined : "You’re hidden from Discover. Matches can still chat."} checked={!prefs.isActive} onChange={(paused) => void update({ isActive: !paused })} />
        </Group>

        <Group id="socials" title="Socials">
          <LinkRow href="/profile/edit#socials" label="Instagram" value={props.instagram ? `@${props.instagram}` : "Add"} />
          <LinkRow href="/profile/edit#socials" label="WhatsApp" value={props.whatsapp ? "Added" : "Add"} />
          <SwitchRow label="Share Instagram with matches" hint="Only people you match with can see it" checked={prefs.shareInstagram && Boolean(props.instagram)} disabled={!props.instagram} onChange={(v) => void update({ shareInstagram: v })} />
          <SwitchRow label="Share WhatsApp with matches" hint="Only people you match with can see it" checked={prefs.shareWhatsapp && Boolean(props.whatsapp)} disabled={!props.whatsapp} onChange={(v) => void update({ shareWhatsapp: v })} />
        </Group>

        <Group id="privacy" title="Privacy">
          <button type="button" aria-expanded={showBlocked} onClick={() => setShowBlocked((v) => !v)} className={cn(rowClass, "w-full text-left hover:bg-white/3")}>
            <span className="flex-1">Blocked users</span>
            <span className="text-sm text-ink/50">{blocked.length}</span>
            <ChevronRightIcon size={16} className={cn("text-ink/40 transition-transform", showBlocked && "rotate-90")} />
          </button>
          {showBlocked ? (
            blocked.length ? (
              <ul className="m-0 list-none border-t border-white/5 p-0">
                {blocked.map((person) => (
                  <li key={person.id} className="flex min-h-12 items-center gap-3 px-4 py-1">
                    <span className="flex-1 truncate text-sm">{person.name ?? "Blocked profile"}</span>
                    <Button variant="ghost" size="sm" onClick={() => void unblock(person)}>
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 border-t border-white/5 px-4 py-3 text-sm text-ink/50">You haven’t blocked anyone.</p>
            )
          ) : null}
        </Group>

        <Group>
          <form action={logout}>
            <button type="submit" className={cn(rowClass, "w-full text-left hover:bg-white/3")}>
              Log out
            </button>
          </form>
          <button type="button" onClick={() => setConfirmDelete(true)} className={cn(rowClass, "w-full border-t border-white/5 text-left text-danger hover:bg-white/3")}>
            Delete account
          </button>
        </Group>
      </div>

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete account">
        <div className="flex flex-col gap-4 px-5 pb-1">
          <p className="m-0 text-[15px] leading-normal text-ink/70">This permanently deletes your profile, photos, matches and messages. It can’t be undone.</p>
          <div className="flex gap-2.5">
            <Button variant="quiet" size="md" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Keep account
            </Button>
            <Button variant="danger" size="md" className="flex-1" loading={deleting} onClick={deleteAccount}>
              Delete forever
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
