"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { updateAvatarUrl, removeAvatar } from "./actions";
import { Spinner } from "@/components/Spinner";

// Raw pick is capped generously — the file that actually crosses the
// network is the compressed one. An avatar only ever renders small and
// circular, so it compresses down to a fraction of a portfolio photo's
// target size.
const MAX_PICK_BYTES = 12 * 1024 * 1024; // 12MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 512; // px — plenty for even a large avatar display
const JPEG_QUALITY = 0.85;

export function AvatarUpload({ userId, fullName, avatarUrl }: { userId: string; fullName: string; avatarUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [loading, setLoading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    };
  }, []);

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || loading) return;
    setError(null);
    setJustUploaded(false);

    if (!ALLOWED.has(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PICK_BYTES) {
      setError("Image is too large (max 12MB).");
      return;
    }

    // Swap the avatar to the picked photo immediately, before compression
    // or the network calls even start — the whole point is that tapping
    // "Change photo" shouldn't feel like waiting on a spinner over the
    // old picture.
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    const localPreview = URL.createObjectURL(file);
    localPreviewRef.current = localPreview;
    setPreview(localPreview);
    setLoading(true);

    try {
      const supabase = createClient();

      let toUpload: Blob = file;
      let ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      let contentType = file.type;
      try {
        const compressed = await compressImage(file, { maxDimension: MAX_DIMENSION, quality: JPEG_QUALITY });
        toUpload = compressed.blob;
        ext = compressed.ext;
        contentType = compressed.type;
      } catch {
        // Canvas encoding unsupported for some reason — fall back to the
        // original file rather than blocking the upload on it.
      }

      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, toUpload, {
        contentType,
        upsert: true,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      await updateAvatarUrl(url);
      setPreview(url);
      setJustUploaded(true);
      window.setTimeout(() => setJustUploaded(false), 1400);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't upload your photo. Please try again.");
      setPreview(avatarUrl); // back out to the last saved photo, not a broken local blob
    } finally {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = null;
      }
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    setJustUploaded(false);
    try {
      await removeAvatar();
      setPreview(null);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't remove your photo.");
    } finally {
      setLoading(false);
    }
  }

  function openPicker() {
    if (!loading) inputRef.current?.click();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={openPicker}
        disabled={loading}
        aria-label={preview ? "Change photo" : "Upload photo"}
        className="group relative w-16 h-16 rounded-full overflow-hidden bg-indigo-soft flex items-center justify-center flex-shrink-0 ring-2 ring-border hover:ring-gold-soft transition-all disabled:cursor-wait"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-lg font-bold text-indigo">{initials || "?"}</span>
        )}

        {!loading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-[10px] font-semibold">Change</span>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {justUploaded && !loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-[11px]">✓</span>
          </div>
        )}
      </button>
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={loading}
            className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-60 disabled:cursor-wait transition-colors active:scale-[0.98]"
          >
            {preview ? "Change photo" : "Upload photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="text-xs font-semibold text-danger hover:underline disabled:opacity-60 disabled:cursor-wait"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-faint mt-1">JPG, PNG or WEBP.</p>
        {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
      </div>
    </div>
  );
}
