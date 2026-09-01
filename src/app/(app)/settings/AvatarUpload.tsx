"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl, removeAvatar } from "./actions";
import { Spinner } from "@/components/Spinner";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AvatarUpload({ userId, fullName, avatarUrl }: { userId: string; fullName: string; avatarUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ALLOWED.has(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large (max 4MB).");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      await updateAvatarUrl(url);
      setPreview(url);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't upload your photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      await removeAvatar();
      setPreview(null);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't remove your photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-soft flex items-center justify-center flex-shrink-0 ring-2 ring-border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-lg font-bold text-indigo">{initials || "?"}</span>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-60"
          >
            {preview ? "Change photo" : "Upload photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="text-xs font-semibold text-danger hover:underline disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-faint mt-1">JPG, PNG or WEBP. Max 4MB.</p>
        {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
      </div>
    </div>
  );
}
