import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { NewOrderWizard } from "./NewOrderWizard";

export default async function NewOrderPage({ searchParams }: { searchParams: { customer?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const [{ data: customers }, { data: measurements }] = await Promise.all([
    supabase.from("customers").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").order("full_name"),
    // Fetched up front for every customer in the org, not per-selection —
    // the wizard is a single client component with no server round trip
    // between steps, so it filters this by whichever customer gets picked
    // in Step 1. Fine at the scale this app is built for; an org with an
    // unusually large measurement history is the one case to revisit this.
    supabase
      .from("measurements")
      .select("id, customer_id, label, chest, waist, hips, shoulder, sleeve_length, garment_length, created_at")
      .eq("organization_id", profile?.organization_id ?? "")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHead title="Create New Order" subtitle="Follow the steps below. We will calculate the balance for you." crumb="Orders / New" actions={<Button href="/orders" variant="outline">← Orders</Button>} />
      <NewOrderWizard customers={customers ?? []} measurements={measurements ?? []} defaultCustomer={searchParams.customer} />
    </div>
  );
}
