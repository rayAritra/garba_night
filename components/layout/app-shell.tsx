"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/photo";
import { Wordmark } from "@/components/ui/glass-panel";
import { useInbox } from "@/components/layout/inbox-provider";
import {
  ChatFilledIcon,
  ChatIcon,
  HeartFilledIcon,
  HeartIcon,
  ProfileFilledIcon,
  ProfileIcon,
  SparkFilledIcon,
  SparkIcon,
} from "@/components/ui/icons";

const NAV = [
  { href: "/discover", label: "Discover", Icon: SparkIcon, ActiveIcon: SparkFilledIcon },
  { href: "/matches", label: "Matches", Icon: HeartIcon, ActiveIcon: HeartFilledIcon },
  { href: "/messages", label: "Chats", Icon: ChatIcon, ActiveIcon: ChatFilledIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon, ActiveIcon: ProfileFilledIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/") || pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Floating glass tab bar (mobile/tablet). Content reserves space for it via the `pb-nav` utility. */
export function BottomNav() {
  const pathname = usePathname();
  const { unreadTotal } = useInbox();
  return (
    <nav aria-label="Primary" className="glass bottom-safe fixed inset-x-4 z-40 mx-auto grid h-[68px] max-w-[448px] grid-cols-4 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,.5)] lg:hidden">
      {NAV.map(({ href, label, Icon, ActiveIcon }) => {
        const active = isActive(pathname, href);
        const unread = href === "/messages" && unreadTotal > 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={unread ? `${label}, ${unreadTotal} unread` : undefined}
            className={cn("relative flex flex-col items-center justify-center gap-1 rounded-[20px] text-[11px] font-semibold no-underline transition-colors focus-visible:outline-offset-[-4px]", active ? "text-ink" : "text-ink/50 hover:text-ink/80")}
          >
            <span className="relative">
              {active ? <ActiveIcon className="text-saffron" /> : <Icon />}
              {unread ? <span aria-hidden="true" className="absolute -top-0.5 -right-1 size-2 rounded-full bg-rose shadow-[0_0_0_2px_#0F0F12]" /> : null}
            </span>
            {label}
            {active ? <span aria-hidden="true" className="absolute bottom-1.5 h-[3px] w-4 rounded-sm bg-saffron shadow-[0_0_10px_rgba(255,181,71,.8)]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop sidebar from DiscoverDesktop.html. */
function Sidebar() {
  const pathname = usePathname();
  const { unreadTotal, viewer } = useInbox();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col gap-9 border-r border-white/5 px-5 py-7 lg:flex">
      <Link href="/discover" className="pl-3.5 no-underline">
        <Wordmark large />
      </Link>
      <nav aria-label="Primary" className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon, ActiveIcon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-12 items-center gap-3.5 rounded-sm px-3.5 text-[15px] font-semibold no-underline transition-colors", active ? "bg-saffron/8 text-ink" : "text-ink/55 hover:bg-white/4 hover:text-ink")}
            >
              {active ? <ActiveIcon size={20} className="text-saffron" /> : <Icon size={20} />}
              {label}
              {href === "/messages" && unreadTotal > 0 ? (
                <span className="ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-saffron px-1.5 text-xs font-bold text-on-accent">
                  {unreadTotal}
                  <span className="sr-only"> unread</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <Link href="/profile" className="mt-auto flex items-center gap-3 rounded-md px-3.5 py-2.5 no-underline hover:bg-white/4">
        <Avatar path={viewer.photo} name={viewer.name} seed={viewer.id} size={40} />
        <span className="flex flex-col">
          <span className="text-sm font-bold">{viewer.name}</span>
          <span className="text-xs text-ink/50">View profile</span>
        </span>
      </Link>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Conversations and the editor are full-screen on mobile: their composer / save bar takes the nav's place.
  const hideNav = pathname.startsWith("/messages/") || pathname === "/profile/edit";
  return (
    <div className="relative min-h-dvh">
      <Sidebar />
      <div className="lg:pl-[260px]">{children}</div>
      {hideNav ? null : <BottomNav />}
    </div>
  );
}
