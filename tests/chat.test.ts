import { describe, expect, it } from "vitest";
import { confirmSend, fromRows, isNearBottom, optimistic, prependOlder, sendErrorMessage, setStatus, upsertMessage } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";

const row = (id: number, sender = "me", content = `m${id}`): ChatMessage => ({ id, match_id: "x", sender_id: sender, content, created_at: new Date(2026, 9, 12, 19, id).toISOString(), read_at: null });

describe("optimistic chat reconciliation", () => {
  it("insert response replaces the optimistic bubble", () => {
    const list = [optimistic("x", "me", "hi", "c1")];
    const next = confirmSend(list, "c1", row(10, "me", "hi"));
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 10, status: "sent", clientId: "c1" });
  });

  it("realtime arriving before the insert response never duplicates", () => {
    let list = [optimistic("x", "me", "hi", "c1")];
    list = upsertMessage(list, row(10, "me", "hi")); // realtime first
    list = confirmSend(list, "c1", row(10, "me", "hi")); // then the response
    expect(list.map((m) => m.id)).toEqual([10]);
  });

  it("incoming messages append; updates (read receipts) apply in place", () => {
    let list = fromRows([row(1)]);
    list = upsertMessage(list, row(2, "them"));
    list = upsertMessage(list, { ...row(1), read_at: "2026-10-12T20:00:00Z" });
    expect(list.map((m) => m.id)).toEqual([1, 2]);
    expect(list[0].read_at).toBe("2026-10-12T20:00:00Z");
  });

  it("failed sends can be retried without losing their place", () => {
    let list = [...fromRows([row(1)]), optimistic("x", "me", "retry me", "c2")];
    list = setStatus(list, "c2", "failed");
    expect(list[1].status).toBe("failed");
    list = setStatus(list, "c2", "sending");
    expect(list[1].status).toBe("sending");
  });

  it("older pages prepend without duplicates", () => {
    const list = prependOlder(fromRows([row(3), row(4)]), [row(1), row(2), row(3)]);
    expect(list.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("chat helpers", () => {
  it("near-bottom threshold", () => {
    expect(isNearBottom({ scrollHeight: 2000, scrollTop: 1300, clientHeight: 600 })).toBe(true);
    expect(isNearBottom({ scrollHeight: 2000, scrollTop: 800, clientHeight: 600 })).toBe(false);
  });
  it("maps backend errors to friendly copy", () => {
    expect(sendErrorMessage({ message: "You are sending messages too quickly" })).toMatch(/Slow down/);
    expect(sendErrorMessage({ code: "42501", message: "new row violates row-level security policy" })).toMatch(/ended/);
  });
});
