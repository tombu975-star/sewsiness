"use client";

import { useRef, useTransition } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      startTransition(() => formRef.current?.requestSubmit());
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
          <form ref={formRef} action={updatePlatformLogo}>
            <input ref={inputRef} type="file" name="logo" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
          </form>
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
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      startTransition(() => formRef.current?.requestSubmit());
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

      <form ref={formRef} action={addPlatformCoverImage}>
        <input ref={inputRef} type="file" name="image" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
      </form>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending || images.length >= 8}
        className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunken disabled:opacity-60"
      >
        {pending ? "Uploading…" : "+ Add image"}
      </button>
    </div>
  );
}

function AdvertisementsCard({ ads }: { ads: PlatformAdInput[] }) {
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
        <form action={addPlatformAdvertisement} className="rounded-lg border border-border p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-muted">Add an advertisement</div>
          <div>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              required
              className="text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
            />
          </div>
          <input
            type="text"
            name="headline"
            required
            placeholder='Headline (e.g. "Now accepting Mobile Money payments")'
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <input
            type="text"
            name="caption"
            placeholder="Short caption (optional)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <input
            type="url"
            name="link_url"
            placeholder="Link — https://… (optional)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          />
          <SubmitButton pendingLabel="Adding…">+ Add advertisement</SubmitButton>
        </form>
      )}
    </div>
  );
}

