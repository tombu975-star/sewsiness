import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createFabric } from "../actions";

export default function NewFabricPage() {
  return (
    <div>
      <PageHead title="New Fabric" crumb="Fabrics / New" />
      <form action={createFabric} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Fabric name</label>
          <input name="name" required placeholder="e.g. Ankara Wax Print" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Type</label>
            <input name="type" placeholder="e.g. Cotton, Lace" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Color</label>
            <input name="color" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Price per yard (₵)</label>
            <input name="price_per_yard" type="number" step="0.01" min="0" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Stock (yards)</label>
            <input name="stock_yards" type="number" step="0.5" min="0" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/fabrics" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Fabric</SubmitButton>
        </div>
      </form>
    </div>
  );
}
