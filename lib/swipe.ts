/** Pure swipe/deck helpers shared by the Discover deck and its tests. */

export type SwipeDecision = "LIKE" | "PASS";

export const SWIPE_DISTANCE = 110;
export const SWIPE_VELOCITY = 650;
export const MAX_ROTATION = 8;
/** Refill the queue when this few cards remain. */
export const REFILL_AT = 4;
export const BATCH_SIZE = 15;

/** Card tilt for a horizontal offset: gentle, capped at ±8°. */
export function rotationFor(x: number) {
  return Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, x / 22));
}

/** 0 → 1 as the card travels toward the commit distance; drives stamps and the rising next card. */
export function dragProgress(x: number) {
  return Math.min(Math.abs(x) / 120, 1);
}

/** A drag commits if it went far enough, or was flicked fast enough in the direction it moved. */
export function decideSwipe(offsetX: number, velocityX: number): SwipeDecision | null {
  if (offsetX > SWIPE_DISTANCE || (velocityX > SWIPE_VELOCITY && offsetX > 24)) return "LIKE";
  if (offsetX < -SWIPE_DISTANCE || (velocityX < -SWIPE_VELOCITY && offsetX < -24)) return "PASS";
  return null;
}

/** Append a fetched batch, skipping anyone already queued or already swiped this session. */
export function mergeBatch<T extends { id: string }>(queue: T[], batch: T[], seen: ReadonlySet<string>): T[] {
  const queued = new Set(queue.map((p) => p.id));
  const additions = batch.filter((p) => !queued.has(p.id) && !seen.has(p.id));
  return additions.length ? [...queue, ...additions] : queue;
}

/** Which photo a tap on the card selects: left third/half goes back, right goes forward. */
export function photoAfterTap(current: number, count: number, tapX: number, width: number) {
  if (count <= 1) return current;
  const forward = tapX >= width / 2;
  return Math.max(0, Math.min(count - 1, current + (forward ? 1 : -1)));
}
