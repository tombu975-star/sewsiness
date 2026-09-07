import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function FreelancerPaymentsPage() {
  await requirePageRole(["owner", "manager", "freelancer"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isFreelancer = profile?.role === "freelancer";

  let query = supabase
    .from("work_requests")
    .select("id, title, amount, status, created_at, freelancer:freelancer_id(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .in("status", ["Completed", "Paid"])
    .order("created_at", { ascending: false });
  if (isFreelancer) query = query.eq("freelancer_id", user!.id);
  const { data: items } = await query;
  const rows = (items ?? []) as any[];

  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.amount), 0);
  const owed = rows.filter((r) => r.status === "Completed").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHead
        title={isFreelancer ? "My Payments" : "Payment Ledger"}
        subtitle="Earnings and payouts derived from completed work requests."
        crumb="Freelancers / Payment Ledger"
      />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Paid Out" value={`₵${paid.toFixed(2)}`} />
        <StatCard label="Owed (Completed, unpaid)" value={`₵${owed.toFixed(2)}`} accent />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="◉" title="No completed jobs yet." description="Once a work request is marked Completed or Paid, it appears here." />
      ) : (
        <DataTable
          columns={[{ key: "title", label: "Job" }, ...(isFreelancer ? [] : [{ key: "freelancer", label: "Freelancer" }]), { key: "amount", label: "Amount" }, { key: "status", label: "Status", isStatus: true }]}
          rows={rows.map((r) => ({
            id: r.id,
            cells: { title: r.title, freelancer: r.freelancer?.full_name, amount: `₵${Number(r.amount).toFixed(2)}`, status: r.status },
          }))}
        />
      )}
    </div>
  );
}
