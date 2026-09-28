import { describe, expect, it } from "vitest";
import { MAX_ROTATION, decideSwipe, dragProgress, mergeBatch, photoAfterTap, rotationFor } from "@/lib/swipe";

describe("swipe physics", () => {
  it("caps rotation at ±8°", () => {
    expect(rotationFor(10_000)).toBe(MAX_ROTATION);
    expect(rotationFor(-10_000)).toBe(-MAX_ROTATION);
    expect(rotationFor(0)).toBe(0);
    expect(Math.abs(rotationFor(88))).toBeLessThan(MAX_ROTATION);
  });

  it("progress saturates at 1", () => {
    expect(dragProgress(60)).toBeCloseTo(0.5);
    expect(dragProgress(-500)).toBe(1);
  });

  it("commits on distance or a directional flick, otherwise springs back", () => {
    expect(decideSwipe(140, 0)).toBe("LIKE");
    expect(decideSwipe(-140, 0)).toBe("PASS");
    expect(decideSwipe(40, 900)).toBe("LIKE");
    expect(decideSwipe(-40, -900)).toBe("PASS");
    expect(decideSwipe(60, 100)).toBeNull();
    // A fast flick against the drag direction never commits the opposite way.
    expect(decideSwipe(-40, 900)).toBeNull();
  });
});

describe("deck queue", () => {
  const p = (id: string) => ({ id });
  it("appends only people not already queued or swiped this session", () => {
    const merged = mergeBatch([p("a"), p("b")], [p("b"), p("c"), p("d")], new Set(["d"]));
    expect(merged.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
  it("keeps the same array when nothing new arrived", () => {
    const queue = [p("a")];
    expect(mergeBatch(queue, [p("a")], new Set())).toBe(queue);
  });
});

describe("photo taps", () => {
  it("steps forward on the right half and back on the left, clamped", () => {
    expect(photoAfterTap(0, 3, 300, 358)).toBe(1);
    expect(photoAfterTap(0, 3, 20, 358)).toBe(0);
    expect(photoAfterTap(2, 3, 300, 358)).toBe(2);
    expect(photoAfterTap(0, 1, 300, 358)).toBe(0);
  });
});
