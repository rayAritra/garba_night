import type { Metadata } from "next";
import { GlowOrb } from "@/components/ui/glass-panel";
import { ChatsView } from "@/components/matches/inbox";

export const metadata: Metadata = { title: "Chats" };

export default function MessagesPage() {
  return (
    <main className="pb-nav relative isolate mx-auto min-h-dvh max-w-[640px] overflow-hidden lg:pt-6">
      <GlowOrb className="-bottom-15 -left-40 size-[440px]" />
      <header className="pt-safe px-5 lg:px-4">
        <h1 className="m-0 pt-6 text-[32px] font-extrabold tracking-[-0.035em]">Chats</h1>
      </header>
      <ChatsView />
    </main>
  );
}
