"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { PortfolioImageUpload } from "./PortfolioImageUpload";

export function PortfolioForm({
  action,
  organizationId,
  apprentices,
}: {
  action: (formData: FormData) => void;
  organizationId: string;
  apprentices: { id: string; full_name: string }[] | null; // null means "the signed-in apprentice", no picker shown
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  return (
    <form action={action} className="card p-6 max-w-xl space-y-4">
      {apprentices && (
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Apprentice</label>
          <select
            name="apprentice_id"
            required
            defaultValue=""
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select…
            </option>
            {apprentices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Title</label>
        <input
          name="title"
          required
          placeholder="e.g. Beaded bridal gown"
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      <PortfolioImageUpload
        organizationId={organizationId}
        onUploaded={setImageUrl}
        onUploadingChange={setPhotoUploading}
      />
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />

      <div className="flex items-center gap-2 pt-2">
        <Button href="/portfolios" variant="ghost">
          Cancel
        </Button>
        <SaveButton photoUploading={photoUploading} />
      </div>
    </form>
  );
}

// Wraps SubmitButton's own pending state (from useFormStatus) with the
// photo-upload state lifted from PortfolioImageUpload, so a fast tap on
// Save can't outrace the upload and save a piece with no image attached.
function SaveButton({ photoUploading }: { photoUploading: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || photoUploading;
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait disabled:active:scale-100 bg-gold text-[#3a2400] hover:brightness-[1.03] border border-gold shadow-[var(--shadow-gold)]"
    >
      {busy && <Spinner />}
      {pending ? "Saving…" : photoUploading ? "Uploading photo…" : "Save Piece"}
    </button>
  );
}
