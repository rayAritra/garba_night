"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { compressImage, uploadPhoto } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { Photo } from "@/components/ui/photo";

export const MAX_PHOTOS = 3;
export const MIN_PHOTOS = 2;

type Upload = { id: string; preview: string; progress: number; error?: string };

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Photos.html grid: lead photo 2×2, two small slots. Tap a photo to make it primary; drag (or use
 * arrow keys) to reorder. Files are compressed in the browser and uploaded to `<uid>/<uuid>.webp`.
 */
export function ImageUploader({
  userId,
  value,
  onChange,
  onRemove,
  onBusyChange,
}: {
  userId: string;
  value: string[];
  onChange: (paths: string[]) => void;
  /** Called with a removed storage path; the caller deletes it once the profile is saved. */
  onRemove: (path: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const pointer = useRef<{ index: number; x: number; y: number; id: number; active: boolean; timer?: number } | null>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onBusyChange?.(uploads.some((u) => !u.error));
  }, [uploads, onBusyChange]);

  const slotsLeft = MAX_PHOTOS - value.length - uploads.filter((u) => !u.error).length;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const picked = Array.from(files).slice(0, Math.max(slotsLeft, 0));
    if (files.length > picked.length) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setError("Your session expired. Sign in again.");

    await Promise.all(
      picked.map(async (file) => {
        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);
        setUploads((list) => [...list, { id, preview, progress: 0 }]);
        const update = (patch: Partial<Upload>) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
        try {
          if (!file.type.startsWith("image/")) throw new Error("That file isn’t a photo.");
          const blob = await compressImage(file);
          const path = `${userId}/${id}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
          await uploadPhoto(blob, path, token, (fraction) => update({ progress: fraction }));
          onChange([...valueRef.current, path]);
          valueRef.current = [...valueRef.current, path];
          setUploads((list) => list.filter((u) => u.id !== id));
          URL.revokeObjectURL(preview);
        } catch (err) {
          update({ error: err instanceof Error ? err.message : "Upload failed." });
        }
      }),
    );
  };

  const dismissUpload = (id: string) =>
    setUploads((list) => {
      const item = list.find((u) => u.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return list.filter((u) => u.id !== id);
    });

  const makePrimary = (index: number) => {
    if (index === 0) return;
    onChange(move(value, index, 0));
    setAnnounce("Set as primary photo.");
  };

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    onChange(move(value, from, to));
    setAnnounce(`Moved to position ${to + 1} of ${value.length}.`);
  };

  const remove = (index: number) => {
    onRemove(value[index]);
    onChange(value.filter((_, i) => i !== index));
    setAnnounce("Photo removed.");
  };

  // Pointer drag-to-reorder. Mouse starts after a small move; touch after a short hold.
  const indexAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-photo-index]");
    return el ? Number(el.dataset.photoIndex) : null;
  };
  const onPointerDown = (index: number) => (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-remove]")) return;
    const state = { index, x: event.clientX, y: event.clientY, id: event.pointerId, active: false, timer: undefined as number | undefined };
    if (event.pointerType !== "mouse") {
      state.timer = window.setTimeout(() => {
        state.active = true;
        setDrag({ from: index, over: index });
        navigator.vibrate?.(10);
      }, 260);
    }
    pointer.current = state;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current;
    if (!state || state.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - state.x, event.clientY - state.y) > 6;
    if (!state.active && moved) {
      if (event.pointerType === "mouse") {
        state.active = true;
        setDrag({ from: state.index, over: state.index });
      } else {
        window.clearTimeout(state.timer);
        pointer.current = null;
        return;
      }
    }
    if (state.active) {
      const over = indexAt(event.clientX, event.clientY);
      if (over !== null) setDrag({ from: state.index, over });
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = pointer.current;
    pointer.current = null;
    if (!state) return;
    window.clearTimeout(state.timer);
    if (state.active) {
      const over = indexAt(event.clientX, event.clientY) ?? state.index;
      reorder(state.index, over);
      setDrag(null);
    } else {
      makePrimary(state.index);
    }
  };
  const onPointerCancel = () => {
    if (pointer.current) window.clearTimeout(pointer.current.timer);
    pointer.current = null;
    setDrag(null);
  };

  const onTileKey = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      reorder(index, index - 1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      reorder(index, index + 1);
    }
  };

  const tiles = [
    ...value.map((path, index) => ({ kind: "photo" as const, path, index })),
    ...uploads.map((upload) => ({ kind: "upload" as const, upload })),
    ...(slotsLeft > 0 ? [{ kind: "add" as const }] : []),
  ].slice(0, MAX_PHOTOS);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid h-[420px] max-h-[56dvh] min-h-[330px] grid-cols-3 grid-rows-2 gap-2.5">
        {tiles.map((tile, slot) => {
          const lead = slot === 0;
          const tileClass = cn("relative overflow-hidden border border-white/8", lead ? "col-span-2 row-span-2 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,.5)]" : "rounded-[20px]");
          if (tile.kind === "photo") {
            const dragging = drag?.from === tile.index;
            const target = drag && drag.over === tile.index && drag.from !== tile.index;
            return (
              <div
                key={tile.path}
                data-photo-index={tile.index}
                onPointerDown={onPointerDown(tile.index)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onContextMenu={(e) => e.preventDefault()}
                className={cn(tileClass, "touch-none select-none", dragging && "scale-[.96] opacity-60", target && "ring-2 ring-saffron", "transition-[transform,opacity] duration-150")}
              >
                <Photo path={tile.path} alt="" seed={tile.path} sizes={lead ? "240px" : "120px"} />
                <button
                  type="button"
                  onKeyDown={onTileKey(tile.index)}
                  onClick={(e) => e.detail === 0 && makePrimary(tile.index)}
                  aria-label={`Photo ${tile.index + 1} of ${value.length}${tile.index === 0 ? ", primary" : ". Press Enter to make primary"}. Use arrow keys to reorder.`}
                  className="absolute inset-0 focus-visible:outline-offset-[-3px]"
                />
                {tile.index === 0 ? (
                  <span className="pointer-events-none absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-saffron px-3 text-xs font-bold text-on-accent">Primary</span>
                ) : null}
                <button
                  type="button"
                  data-remove
                  aria-label={`Remove photo ${tile.index + 1}`}
                  onClick={() => remove(tile.index)}
                  className={cn("absolute flex items-center justify-center rounded-full border border-white/12 bg-[rgba(10,10,12,.55)] text-ink backdrop-blur-lg", lead ? "top-2.5 right-2.5 size-11" : "top-1.5 right-1.5 size-9 before:absolute before:-inset-1 before:content-['']")}
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            );
          }
          if (tile.kind === "upload") {
            const { upload } = tile;
            const circumference = 113;
            return (
              <div key={upload.id} className={tileClass}>
                {/* Local preview only — nothing leaves the device until compression finishes. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upload.preview} alt="" className="absolute inset-0 size-full object-cover brightness-[.55]" />
                {upload.error ? (
                  <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-night/60 p-2 text-center">
                    <span className="text-xs font-semibold text-danger">{upload.error}</span>
                    <button type="button" onClick={() => dismissUpload(upload.id)} className="h-9 rounded-full bg-white/10 px-3 text-xs font-semibold">
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div role="progressbar" aria-label="Uploading photo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(upload.progress * 100)} className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3" />
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#FFB547" strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - upload.progress)} transform="rotate(-90 22 22)" className="transition-[stroke-dashoffset] duration-200" />
                    </svg>
                    <span className="text-xs font-semibold text-ink/80">{Math.round(upload.progress * 100)}%</span>
                  </div>
                )}
              </div>
            );
          }
          return (
            <button
              key="add"
              type="button"
              onClick={() => fileInput.current?.click()}
              className={cn(tileClass, "flex flex-col items-center justify-center gap-2 bg-surface text-ink/70 transition-colors hover:bg-hover")}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-saffron/12 text-saffron">
                <PlusIcon size={20} />
              </span>
              <span className="text-[13px] font-semibold">Add photo</span>
            </button>
          );
        })}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="m-0 text-center text-[13px] text-ink/46">{value.length > 1 ? "Hold and drag to reorder · Tap to set as primary" : `Add at least ${MIN_PHOTOS} photos. The first one leads.`}</p>
      {error ? (
        <p role="alert" className="m-0 text-center text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
