import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";

// A Freelancer's whole world in this app is their own job pipeline —
// jobs offered to them, accepted, completed, and what they're owed
// (see Freelancer Hub / Available Jobs / My Payments in nav.ts, all of
// which already filter to `freelancer_id = <them>`; freelancer-payments
// and freelancer-work-requests both do this same self-filter already).
// This dashboard mirrors that same filter so the numbers agree with
// those two pages exactly.
export async function FreelancerDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();

  const [{ data: freelancerProfile }, { data: requests }] = await Promise.all([
    supabase
      .from("freelancer_profiles")
      .select("primary_skill, specialisation, years_experience, location")
      .eq("profile_id", userId)
      .maybeSingle(),
    supabase
      .from("work_requests")
      .select("id, title, amount, status, created_at")
      .eq("freelancer_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const rows = (requests ?? []) as any[];
  const offered = rows.filter((r) => r.status === "Offered");
  const active = rows.filter((r) => r.status === "Accepted");
  const owed = rows.filter((r) => r.status === "Completed").reduce((s, r) => s + Number(r.amount), 0);
  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.amount), 0);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        crumb={`Freelancer · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle={
          (freelancerProfile as any)?.primary_skill
            ? `${(freelancerProfile as any).primary_skill}${(freelancerProfile as any)?.location ? ` · ${(freelancerProfile as any).location}` : ""}`
            : "Your jobs and earnings, at a glance."
        }
        actions={
          <Button href="/freelancer-work-requests" variant="outline">
            View Available Jobs
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="New Offers" value={offered.length} icon="◔" />
        <StatCard label="In Progress" value={active.length} icon="✂" />
        <StatCard label="Owed (Completed)" value={`₵${owed.toFixed(2)}`} accent icon="◉" />
        <StatCard label="Paid Out" value={`₵${paid.toFixed(2)}`} icon="◈" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">My Jobs</h2>
        <a href="/freelancer-payments" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
          View payment ledger <span aria-hidden="true">→</span>
        </a>
      </div>
      <DataTable
        columns={[
          { key: "title", label: "Job" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status", isStatus: true },
        ]}
        rows={rows.slice(0, 8).map((r) => ({
          id: r.id,
          href: "/freelancer-work-requests",
          cells: { title: r.title, amount: `₵${Number(r.amount).toFixed(2)}`, status: r.status },
        }))}
        emptyLabel="No jobs offered to you yet — check back soon."
      />
    </div>
  );
}
