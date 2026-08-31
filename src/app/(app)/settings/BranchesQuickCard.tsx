import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { quickCreateBranch } from "./actions";

export function BranchesQuickCard({ branches }: { branches: { id: string; name: string; city: string | null }[] }) {
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-semibold text-ink">Branches</div>
          <Link href="/branches" className="text-xs font-semibold text-indigo hover:underline">
            Open full directory →
          </Link>
        </div>
        {branches.length === 0 ? (
          <p className="text-sm text-ink-muted">No branches yet — add your first one below.</p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {branches.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-2 py-2.5 text-sm">
                <span className="font-medium text-ink">{b.name}</span>
                <span className="text-ink-muted">{b.city || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={quickCreateBranch} className="card p-6 max-w-lg space-y-4">
        <div className="font-display font-semibold text-ink">Add a branch</div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Branch name</label>
          <input name="name" required placeholder="e.g. Osu — Main" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">City</label>
          <input name="city" className="w-full sm:w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <SubmitButton pendingLabel="Adding…">Add Branch</SubmitButton>
      </form>
    </div>
  );
}
