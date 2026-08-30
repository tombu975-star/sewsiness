import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createBranch } from "../actions";

export default function NewBranchPage() {
  return (
    <div>
      <PageHead title="New Branch" crumb="Branches / New" />
      <form action={createBranch} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Branch name</label>
          <input name="name" required placeholder="e.g. Osu — Main" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">City</label>
          <input name="city" className="w-full sm:w-64 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/branches" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Branch</SubmitButton>
        </div>
      </form>
    </div>
  );
}
