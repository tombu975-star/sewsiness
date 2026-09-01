import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function WorkforcePage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const [{ count: staffCount }, { count: apprenticeCount }, { count: freelancerCount }, { count: branchCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("organization_id", orgId).in("role", ["owner", "manager", "staff", "trainer"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("role", "apprentice"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("organization_id", orgId).eq("role", "freelancer"),
    supabase.from("branches").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
  ]);

  return (
    <div>
      <PageHead title="Workforce Hub" subtitle="Combined view across staff, freelancers and apprentices." crumb="Workforce Hub" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Staff" value={staffCount ?? 0} />
        <StatCard label="Apprentices" value={apprenticeCount ?? 0} />
        <StatCard label="Freelancers" value={freelancerCount ?? 0} />
        <StatCard label="Branches" value={branchCount ?? 0} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="font-display font-semibold text-ink mb-1">Staff</div>
          <p className="text-xs text-ink-muted mb-3">Employment records, roles and branches.</p>
          <Button href="/staff" variant="outline">Open Staff →</Button>
        </div>
        <div className="card p-5">
          <div className="font-display font-semibold text-ink mb-1">Apprentices</div>
          <p className="text-xs text-ink-muted mb-3">Self-service login, training and portfolio.</p>
          <Button href="/apprentices" variant="outline">Open Apprentices →</Button>
        </div>
        <div className="card p-5">
          <div className="font-display font-semibold text-ink mb-1">Freelancers</div>
          <p className="text-xs text-ink-muted mb-3">Work relationship: Job → Work → Payment.</p>
          <Button href="/freelancers" variant="outline">Open Freelancers →</Button>
        </div>
      </div>
    </div>
  );
}
