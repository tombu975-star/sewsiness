import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createDesign } from "../actions";

export default function NewDesignPage() {
  return (
    <div>
      <PageHead title="New Design" crumb="Dressmaking / Designs / New" />
      <form action={createDesign} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Design name</label>
          <input name="name" required placeholder="e.g. Classic Kaba & Slit" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Category</label>
            <input name="category" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Price (₵)</label>
            <input name="price" type="number" step="0.01" min="0" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Lead time (days)</label>
          <input name="lead_time_days" type="number" min="0" className="w-full sm:w-40 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/designs" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Design</SubmitButton>
        </div>
      </form>
    </div>
  );
}
