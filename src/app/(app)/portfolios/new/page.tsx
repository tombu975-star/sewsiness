import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { addPortfolioItem } from "../actions";

export default async function NewPortfolioItemPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isApprentice = profile?.role === "apprentice";

  const { data: apprentices } = isApprentice
    ? { data: [] }
    : await supabase.from("profiles").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").eq("role", "apprentice").order("full_name");

  return (
    <div>
      <PageHead title="Add Portfolio Piece" crumb="Apprentices / Portfolios / New" />
      <form action={addPortfolioItem} className="card p-6 max-w-xl space-y-4">
        {!isApprentice && (
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Apprentice</label>
            <select name="apprentice_id" required className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
              <option value="" disabled selected>Select…</option>
              {(apprentices ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Title</label>
          <input name="title" required placeholder="e.g. Beaded bridal gown" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
          <textarea name="description" rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <p className="text-xs text-ink-faint">Photo upload isn't wired up yet — add a description for now; images can be added once storage is configured.</p>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/portfolios" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Piece</SubmitButton>
        </div>
      </form>
    </div>
  );
}
