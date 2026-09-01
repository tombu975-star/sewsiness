import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { saveMeasurement } from "../actions";

export default async function NewMeasurementPage({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: customers } = await supabase.from("customers").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").order("full_name");

  const numField = (label: string, name: string) => (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label} (in)</label>
      <input name={name} type="number" step="0.25" min="0" className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
    </div>
  );

  return (
    <div>
      <PageHead title="Record Measurements" crumb="Customers / Measurements / New" />
      <form action={saveMeasurement} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Customer</label>
          <select name="customer_id" required defaultValue={searchParams.customer ?? ""} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold">
            <option value="" disabled>Select a customer…</option>
            {(customers ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Set label</label>
          <input name="label" defaultValue="Standard" className="w-full sm:w-64 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {numField("Chest", "chest")}
          {numField("Waist", "waist")}
          {numField("Hips", "hips")}
          {numField("Shoulder", "shoulder")}
          {numField("Sleeve length", "sleeve_length")}
          {numField("Garment length", "garment_length")}
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Notes</label>
          <textarea name="notes" rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button href="/measurements" variant="ghost">Cancel</Button>
          <SubmitButton pendingLabel="Saving…">Save Measurements</SubmitButton>
        </div>
      </form>
    </div>
  );
}
