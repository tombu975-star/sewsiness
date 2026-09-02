"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addPlatformCoverImage,
  removePlatformCoverImage,
  movePlatformCoverImage,
  updatePlatformLogo,
  removePlatformLogo,
  updatePlatformCoverCopy,
  addPlatformAdvertisement,
  removePlatformAdvertisement,
  movePlatformAdvertisement,
} from "./actions";

export interface PlatformAdInput {
  id: string;
  imageUrl: string;
  headline: string;
  caption?: string | null;
  linkUrl?: string | null;
}

// Shared by every upload control below. 6MB (not signup's tighter
// 1.2MB — see src/app/signup/actions.ts) because these genuinely are
// meant to be high-resolution marketing photography for the login
// screen, and uploading straight to Storage from the browser (rather
// than through a Server Action's body) means Vercel's 4.5MB request
// ceiling never enters into it at all — see
// 039_platform_branding_direct_upload.sql.
const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function validatePick(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Please choose a JPG, PNG, or WEBP image.";
  if (file.size > MAX_BYTES) return "Image is too large (max 6MB).";
  return null;
}

export function PlatformBrandingForm({
  logoUrl,
  coverImages,
  coverHeadline,
  coverSubheadline,
  ads,
}: {
  logoUrl: string | null;
  coverImages: string[];
  coverHeadline: string;
  coverSubheadline: string;
  ads: PlatformAdInput[];
}) {
  return (
    <div className="space-y-5">
      <div className="card p-4 bg-indigo-soft/40 border-indigo-soft text-[13px] text-ink-soft">
        These control the split-screen cover shown on every sign-in, sign-up, and password-reset
        screen — before anyone has an account. Changes apply everywhere, immediately.
      </div>

      <LogoCard logoUrl={logoUrl} />
      <CoverCopyCard headline={coverHeadline} subheadline={coverSubheadline} />
      <CoverImagesCard images={coverImages} />
      <AdvertisementsCard ads={ads} />
    </div>
  );
}

function LogoCard({ logoUrl }: { logoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    const invalid = validatePick(file);
    if (invalid) return setError(invalid);

    setPending(true);
    try {
      const supabase = createClient();
      const path = `logo.${extFor(file)}`;
      const { error: upErr } = await supabase.storage.from("platform-branding").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("platform-branding").getPublicUrl(path);
      // Cache-bust so a re-upload of the same filename shows immediately
      // instead of the browser serving a stale cached image.
      await updatePlatformLogo(`${pub.publicUrl}?v=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the logo. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="font-display font-semibold text-ink mb-1">Platform logo</div>
      <p className="text-xs text-ink-muted mb-4">
        Shown in the top-left corner of the auth cover. Falls back to the default Sewsiness mark
        when none is set.
      </p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg border border-border bg-sunken flex items-center justify-center overflow-hidden flex-shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Platform logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-ink-faint text-center px-1">Default mark</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-60"
          >
            {pending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <form action={removePlatformLogo}>
              <button type="submit" className="text-xs font-semibold text-danger hover:underline">
                Remove
              </button>
            </form>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-danger mt-2">{error}</p>}
    </div>
  );
}

function CoverCopyCard({ headline, subheadline }: { headline: string; subheadline: string }) {
  return (
    <form action={updatePlatformCoverCopy} className="card p-6 space-y-4">
      <div>
        <div className="font-display font-semibold text-ink mb-1">Cover headline</div>
        <p className="text-xs text-ink-muted mb-3">The large heading on the auth cover.</p>
        <textarea
          name="cover_headline"
          defaultValue={headline}
          rows={2}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Cover subheadline</label>
        <textarea
          name="cover_subheadline"
          defaultValue={subheadline}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold resize-none"
        />
      </div>
      <SubmitButton pendingLabel="Saving…">Save Copy</SubmitButton>
    </form>
  );
}

function CoverImagesCard({ images }: { images: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    const invalid = validatePick(file);
    if (invalid) return setError(invalid);

    setPending(true);
    try {
      const supabase = createClient();
      const path = `cover-${Date.now()}.${extFor(file)}`;
      const { error: upErr } = await supabase.storage.from("platform-branding").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("platform-branding").getPublicUrl(path);
      await addPlatformCoverImage(pub.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the image. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="font-display font-semibold text-ink">Rolling cover images</div>
        <span className="text-xs text-ink-faint">{images.length} / 8</span>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Crossfades through these on the auth cover, in order. Add a few high-resolution, portrait-
        friendly photos for the best effect on mobile.
      </p>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-ink-muted mb-4">
          No cover images yet — the cover falls back to the default brand gradient.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-border aspect-[3/4] bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-1.5 left-1.5 badge bg-black/55 text-white">{i + 1}</div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-1">
                  <form action={movePlatformCoverImage}>
                    <input type="hidden" name="url" value={url} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={i === 0} title="Move earlier" className="w-6 h-6 rounded bg-white/90 text-ink text-xs font-bold disabled:opacity-40">
                      ↑
                    </button>
                  </form>
                  <form action={movePlatformCoverImage}>
                    <input type="hidden" name="url" value={url} />
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" disabled={i === images.length - 1} title="Move later" className="w-6 h-6 rounded bg-white/90 text-ink text-xs font-bold disabled:opacity-40">
                      ↓
                    </button>
                  </form>
                </div>
                <form action={removePlatformCoverImage}>
                  <input type="hidden" name="url" value={url} />
                  <button type="submit" title="Remove" className="w-6 h-6 rounded bg-danger text-white text-xs font-bold">
                    ×
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending || images.length >= 8}
        className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-60"
      >
        {pending ? "Uploading…" : "+ Add image"}
      </button>
      {error && <p className="text-[11px] text-danger mt-2">{error}</p>}
    </div>
  );
}

function AdvertisementsCard({ ads }: { ads: PlatformAdInput[] }) {
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    if (f) {
      const invalid = validatePick(f);
      if (invalid) {
        setError(invalid);
        e.target.value = "";
        return;
      }
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose an image for the advertisement.");
    if (!headline.trim()) return setError("Headline is required.");

    setPending(true);
    try {
      const supabase = createClient();
      const path = `ads/ad-${Date.now()}.${extFor(file)}`;
      const { error: upErr } = await supabase.storage.from("platform-branding").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);

      const { data: pub } = supabase.storage.from("platform-branding").getPublicUrl(path);
      await addPlatformAdvertisement({ imageUrl: pub.publicUrl, headline, caption, linkUrl });

      setHeadline("");
      setCaption("");
      setLinkUrl("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the advertisement. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="font-display font-semibold text-ink">Advertisements</div>
        <span className="text-xs text-ink-faint">{ads.length} / 6</span>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Mixed into the rolling images on the /login splash screen — each slide gets a headline,
        an optional short caption, and an optional link. Shown before anyone reaches the sign-in
        form itself, which stays a single calm photo.
      </p>

      {ads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-ink-muted mb-4">
          No advertisements yet — the splash rolls through cover images only.
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {ads.map((ad, i) => (
            <div key={ad.id} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-sunken flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink truncate">{ad.headline}</div>
                {ad.caption && <div className="text-xs text-ink-muted truncate">{ad.caption}</div>}
                {ad.linkUrl && <div className="text-[11px] text-indigo truncate">{ad.linkUrl}</div>}
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <div className="flex items-center gap-1">
                  <form action={movePlatformAdvertisement}>
                    <input type="hidden" name="id" value={ad.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={i === 0} title="Move earlier" className="w-6 h-6 rounded bg-sunken text-ink text-xs font-bold disabled:opacity-40">
                      ↑
                    </button>
                  </form>
                  <form action={movePlatformAdvertisement}>
                    <input type="hidden" name="id" value={ad.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" disabled={i === ads.length - 1} title="Move later" className="w-6 h-6 rounded bg-sunken text-ink text-xs font-bold disabled:opacity-40">
                      ↓
                    </button>
                  </form>
                </div>
                <form action={removePlatformAdvertisement}>
                  <input type="hidden" name="id" value={ad.id} />
                  <button type="submit" title="Remove" className="text-xs font-semibold text-danger hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {ads.length < 6 && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-muted">Add an advertisement</div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePick}
              className="text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
            />
          </div>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder='Headline (e.g. "Now accepting Mobile Money payments")'
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Short caption (optional)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link — https://… (optional)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          {error && <p className="text-[11px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo px-3.5 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {pending ? "Adding…" : "+ Add advertisement"}
          </button>
        </form>
      )}
    </div>
  );
}
