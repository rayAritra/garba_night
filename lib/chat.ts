import type { ChatMessage } from "@/lib/types";

/** A message as the thread renders it: server rows plus optimistic sends that may still be in flight. */
export type ThreadMessage = ChatMessage & { clientId?: string; status: "sent" | "sending" | "failed" };

export const PAGE_SIZE = 50;
/** Within this many px of the bottom counts as "reading the latest" (auto-scroll + mark read). */
export const NEAR_BOTTOM_PX = 120;

export function fromRows(rows: ChatMessage[]): ThreadMessage[] {
  return rows.map((row) => ({ ...row, status: "sent" }));
}

export function optimistic(matchId: string, senderId: string, content: string, clientId: string): ThreadMessage {
  return { id: -Date.now(), clientId, match_id: matchId, sender_id: senderId, content, created_at: new Date().toISOString(), read_at: null, status: "sending" };
}

/**
 * Apply a server row (realtime INSERT/UPDATE or fetch). Updates in place when known; otherwise it
 * replaces the matching in-flight optimistic send (same sender + text) or is appended.
 */
export function upsertMessage(list: ThreadMessage[], row: ChatMessage): ThreadMessage[] {
  if (list.some((m) => m.id === row.id)) return list.map((m) => (m.id === row.id ? { ...m, ...row, status: "sent" } : m));
  const pending = list.findIndex((m) => m.status === "sending" && m.sender_id === row.sender_id && m.content === row.content);
  if (pending >= 0) return list.map((m, i) => (i === pending ? { ...row, clientId: m.clientId, status: "sent" } : m));
  return [...list, { ...row, status: "sent" }];
}

/** The insert for `clientId` succeeded. Realtime may already have reconciled it — never duplicate. */
export function confirmSend(list: ThreadMessage[], clientId: string, row: ChatMessage): ThreadMessage[] {
  if (list.some((m) => m.id === row.id)) return list.filter((m) => m.clientId !== clientId || m.id === row.id);
  return list.map((m) => (m.clientId === clientId ? { ...row, clientId, status: "sent" } : m));
}

export function setStatus(list: ThreadMessage[], clientId: string, status: ThreadMessage["status"]): ThreadMessage[] {
  return list.map((m) => (m.clientId === clientId && m.status !== "sent" ? { ...m, status } : m));
}

/** Older page prepended ahead of what's loaded, without duplicates. */
export function prependOlder(list: ThreadMessage[], older: ChatMessage[]): ThreadMessage[] {
  const known = new Set(list.map((m) => m.id));
  return [...fromRows(older.filter((m) => !known.has(m.id))), ...list];
}

export function isNearBottom(el: { scrollHeight: number; scrollTop: number; clientHeight: number }) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
}

/** Friendly copy for insert failures (rate-limit trigger, ended match, network). */
export function sendErrorMessage(error: { message?: string; code?: string } | null) {
  if (!error) return "Message not sent.";
  if (error.message?.includes("too quickly")) return "Slow down a little — try again in a few seconds.";
  if (error.code === "42501") return "This conversation has ended.";
  return "Message not sent. Check your connection.";
}
