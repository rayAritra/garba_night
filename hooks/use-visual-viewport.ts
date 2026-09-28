"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener("resize", callback);
  vv.addEventListener("scroll", callback);
  return () => {
    vv.removeEventListener("resize", callback);
    vv.removeEventListener("scroll", callback);
  };
}

// Snapshot as a string so React sees a stable value between identical reads.
const snapshot = () => {
  const vv = window.visualViewport;
  return vv ? `${Math.round(vv.height)}:${Math.round(vv.offsetTop)}` : "";
};

/**
 * The visible area above the on-screen keyboard. Android honours `interactive-widget=resizes-content`,
 * but iOS Safari only shrinks the visual viewport — full-screen layouts (chat) size themselves to this.
 */
export function useVisualViewport(): { height: number; offsetTop: number } | null {
  const value = useSyncExternalStore(subscribe, snapshot, () => "");
  if (!value) return null;
  const [height, offsetTop] = value.split(":").map(Number);
  return { height, offsetTop };
}
