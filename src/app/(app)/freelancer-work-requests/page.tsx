import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatusSelect } from "./StatusSelect";

const STATUSES = ["Offered", "Accepted", "Completed", "Paid", "Declined"];

export default async function WorkRequestsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isFreelancer = profile?.role === "freelancer";

  let query = supabase
    .from("work_requests")
    .select("id, title, amount, status, created_at, freelancer:freelancer_id(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });
  if (isFreelancer) query = query.eq("freelancer_id", user!.id);
  const { data: requests } = await query;
  const rows = (requests ?? []) as any[];

  const { data: freelancers } = isFreelancer
    ? { data: [] }
    : await supabase.from("profiles").select("id, full_name").eq("organization_id", profile?.organization_id ?? "").eq("role", "freelancer").order("full_name");

  return (
    <div>
      <PageHead
        title={isFreelancer ? "Available Jobs" : "Work Requests"}
        subtitle={isFreelancer ? "Jobs offered to you." : "Jobs offered to and accepted by freelancers."}
        crumb="Freelancers / Work Requests"
        actions={!isFreelancer && <Button href="/freelancer-work-requests/new">+ Offer Job</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon="⚒" title="No work requests yet." description={isFreelancer ? "You'll see job offers here." : "Offer your first job to a freelancer."} actionLabel={!isFreelancer ? "Offer Job" : undefined} actionHref={!isFreelancer ? "/freelancer-work-requests/new" : undefined} />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-ink">{r.title}</div>
                <div className="text-xs text-ink-muted">
                  {!isFreelancer && `${r.freelancer?.full_name} · `}₵{Number(r.amount).toFixed(2)}
                </div>
              </div>
              <StatusSelect id={r.id} current={r.status} options={STATUSES} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
