const BUCKET = "profile-photos";

/** Public URL for a stored profile photo path (bucket is public; writes are RLS-restricted). */
export function photoUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

export const PHOTO_BUCKET = BUCKET;

/** Types and size the `profile-photos` bucket accepts as-is. */
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** iPhone photos. Windows often reports an empty `file.type` for them, so check the name too. */
export function isHeicFile(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** Anything worth trying to decode: an image MIME type, or a HEIC by extension. */
export function looksLikeImage(file: File) {
  return file.type.startsWith("image/") || isHeicFile(file) || /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name);
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

/** createImageBitmap first; <img> as fallback (Safari decodes HEIC there, and it covers odd bitmap gaps). */
async function decode(blob: Blob): Promise<Decoded | null> {
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {}
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth) throw new Error("empty");
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

/**
 * Resize to max 1440px on the long edge and encode WebP (~85%), keeping uploads well under the 4MB bucket cap.
 * HEIC is converted to JPEG in the browser first (converter loaded only when needed). If a JPG/PNG/WebP
 * can't be decoded locally but already fits the bucket, it's returned untouched rather than rejected.
 */
export async function compressImage(file: File, maxEdge = 1440, quality = 0.85): Promise<Blob> {
  let decoded = await decode(file);
  if (!decoded && isHeicFile(file)) {
    try {
      const { heicTo } = await import("heic-to");
      decoded = await decode(await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 }));
    } catch {}
  }
  if (!decoded) {
    if (UPLOAD_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error(isHeicFile(file) ? "Couldn’t convert this iPhone photo. Try a JPG or PNG." : "We couldn’t read that photo. Try a JPG or PNG.");
  }
  const scale = Math.min(1, maxEdge / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this photo.");
  ctx.drawImage(decoded.source, 0, 0, width, height);
  decoded.release();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (blob && blob.type === "image/webp") return blob;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!jpeg) throw new Error("Your browser couldn't process this photo.");
  return jpeg;
}

/**
 * Upload to the user's own folder with real progress. Same Storage REST endpoint supabase-js uses,
 * authorised by the user's JWT, so the bucket's `auth.uid()` folder policy still applies.
 */
export function uploadPhoto(blob: Blob, path: string, accessToken: string, onProgress: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Content-Type", blob.type);
    xhr.setRequestHeader("x-upsert", "false");
    // Paths are unique per upload, so the file can be cached forever.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? "That photo is too large." : "Upload failed. Try again.")));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(blob);
  });
}
