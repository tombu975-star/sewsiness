import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createCollection } from "../actions";

export default function NewCollectionPage() {
  return (
    <div>
      <PageHead title="New Collection" crumb="Dressmaking / Collections / New" />
      <form action={createCollection} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Collection name</label>
          <input name="name" required placeholder="e.g. Harmattan 2026" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Season</label>
          <input name="season" placeholder="e.g. Christmas, Rainy Season" className="w-full sm:w-64 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/collections" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Collection</SubmitButton>
        </div>
      </form>
    </div>
  );
}
