"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { Spinner } from "@/components/Spinner";

// Raw pick is capped generously — the file that actually crosses the
// network is the compressed one, usually well under 500KB regardless of
// what the phone camera produced.
const MAX_PICK_BYTES = 12 * 1024 * 1024; // 12MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 1600; // px, longest side — plenty for a portfolio card and a lightbox
const JPEG_QUALITY = 0.82;

// Uploads straight to the public "portfolio-images" bucket the moment a
// file is picked, then hands the resulting public URL up to the parent
// form (via onUploaded) so it can ride along with the rest of the form
// fields on submit — no separate save step, no waiting on a
// not-yet-created portfolio_items row to attach the file to.
//
// Uploading state is also reported up (onUploadingChange) so the parent
// can hold the Save button until the file has actually finished landing
// in storage — otherwise a fast tap on Save could save the piece with no
// image and no way to attach one afterward (there's no edit page yet).
export function PortfolioImageUpload({
  organizationId,
  onUploaded,
  onUploadingChange,
}: {
  organizationId: string;
  onUploaded: (url: string | null) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Local object URLs are only good for this tab's lifetime — release the
  // old one whenever it's replaced or the component unmounts, so picking
  // several photos in a row doesn't leak memory.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function setLoadingAndNotify(v: boolean) {
    setLoading(v);
    onUploadingChange(v);
  }

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

    // Show the picked photo immediately, before compression or upload
    // even start, so tapping "Add a photo" never feels like it did
    // nothing.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreview(localPreview);
    setLoadingAndNotify(true);

    try {
      const supabase = createClient();

      // Compression is best-effort — if a browser can't do canvas encode
      // for some reason, fall back to uploading the original file rather
      // than blocking the whole flow on it.
      let toUpload: Blob = file;
      let ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      let contentType = file.type;
      try {
        const compressed = await compressImage(file, { maxDimension: MAX_DIMENSION, quality: JPEG_QUALITY });
        toUpload = compressed.blob;
        ext = compressed.ext;
        contentType = compressed.type;
      } catch {
        // keep original file/ext/type
      }

      const path = `${organizationId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("portfolio-images").upload(path, toUpload, {
        contentType,
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("portfolio-images").getPublicUrl(path);
      onUploaded(pub.publicUrl);
      setJustUploaded(true);
      window.setTimeout(() => setJustUploaded(false), 1400);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't upload that photo. Please try again.");
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreview(null);
      onUploaded(null);
    } finally {
      setLoadingAndNotify(false);
    }
  }

  function handleRemove() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
    onUploaded(null);
    setError(null);
    setJustUploaded(false);
  }

  function openPicker() {
    if (!loading) inputRef.current?.click();
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">Photo</label>

      {preview ? (
        <div
          className="group relative w-full max-w-xs aspect-[4/3] rounded-sm overflow-hidden border border-border bg-sunken cursor-pointer"
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
          aria-label="Change photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full h-full object-cover" />

          {!loading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-semibold">Change photo</span>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1.5">
              <Spinner />
              <span className="text-white text-[11px] font-medium">Uploading…</span>
            </div>
          )}

          {justUploaded && !loading && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <span className="w-9 h-9 rounded-full bg-success text-white flex items-center justify-center text-base">✓</span>
            </div>
          )}

          {!loading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
              aria-label="Remove photo"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="w-full max-w-xs aspect-[4/3] rounded-sm border border-dashed border-border-strong bg-sunken flex flex-col items-center justify-center gap-1.5 text-ink-faint hover:border-gold hover:text-ink-muted active:scale-[0.99] transition-all"
        >
          <span className="text-2xl">⌸</span>
          <span className="text-xs font-semibold">Add a photo</span>
        </button>
      )}

      <p className="text-[11px] text-ink-faint mt-1.5">JPG, PNG or WEBP. Optional.</p>
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
