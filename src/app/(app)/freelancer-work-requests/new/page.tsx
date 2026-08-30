import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { createWorkRequest } from "../actions";

export default async function NewWorkRequestPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: freelancers } = await supabase.from("profiles").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").eq("role", "freelancer").order("full_name");

  return (
    <div>
      <PageHead title="Offer Job" crumb="Freelancers / Work Requests / New" />
      <form action={createWorkRequest} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Freelancer</label>
          <select name="freelancer_id" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="" disabled selected>Select…</option>
            {(freelancers ?? []).map((f: any) => <option key={f.id} value={f.id}>{f.full_name}</option>)}
          </select>
        </div>
        {(freelancers ?? []).length === 0 && (
          <p className="text-xs text-ink-muted">No freelancers yet — <a href="/freelancers/new" className="text-indigo font-medium">invite one first</a>.</p>
        )}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Job title</label>
          <input name="title" required placeholder="e.g. Bead 12 bodices for wedding order" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Amount (₵)</label>
          <input name="amount" type="number" step="0.01" min="0" className="w-full sm:w-48 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/freelancer-work-requests" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Offer Job</SubmitButton>
        </div>
      </form>
    </div>
  );
}
