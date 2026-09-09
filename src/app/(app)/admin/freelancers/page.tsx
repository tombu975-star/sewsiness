import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { verifyFreelancer, unverifyFreelancer } from "../freelancers-actions";
import { suspendUser, reactivateUser } from "../users-actions";

export default async function PlatformFreelancersPage({ searchParams }: { searchParams: { q?: string } }) {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  // RLS ("super admin can read all profiles / freelancer profiles / work
  // requests") is what makes these cross-tenant selects possible. Fetched
  // unfiltered — the stat cards below need the true platform-wide counts
  // regardless of what's typed in the search box, so search only narrows
  // which rows the table shows (computed separately as `displayRows`
  // further down), not what the stats are calculated from.
  const [{ data: freelancers }, { data: requests }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, suspended_at, organization:organization_id(name), freelancer_profiles(primary_skill, years_experience, verified_at)"
      )
      .eq("role", "freelancer")
      .order("full_name"),
    supabase.from("work_requests").select("id, status, amount"),
  ]);

  const rows = (freelancers ?? []) as any[];
  const displayRows = q ? rows.filter((r) => (r.full_name ?? "").toLowerCase().includes(q.toLowerCase())) : rows;
  const requestRows = (requests ?? []) as any[];

  const businessesUsingFreelancers = new Set(rows.map((r) => r.organization?.name).filter(Boolean)).size;
  const verifiedCount = rows.filter((r) => r.freelancer_profiles?.verified_at).length;
  const activeTasks = requestRows.filter((r) => ["Offered", "Accepted"].includes(r.status)).length;

  const skillCounts = new Map<string, number>();
  for (const r of rows) {
    const skill = r.freelancer_profiles?.primary_skill || "Unspecified";
    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
  }

  return (
    <div>
      <PageHead
        title="Freelancer Network"
        subtitle="Platform-wide freelancer directory and verification. Client/customer details behind each job stay with the business."
        crumb="Platform Admin"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Freelancers" value={rows.length} />
        <StatCard label="Verified" value={verifiedCount} accent />
        <StatCard label="Businesses Using Freelancers" value={businessesUsingFreelancers} />
        <StatCard label="Open/Active Jobs" value={activeTasks} />
      </div>

      {skillCounts.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from(skillCounts.entries()).map(([skill, count]) => (
            <span key={skill} className="badge bg-sunken text-ink-muted">
              {skill} · {count}
            </span>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <form method="get" className="relative sm:w-64 mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">⌕</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            aria-label="Search by name"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-strong text-sm bg-surface focus:border-gold"
          />
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState icon="\u2692" title="No freelancers on the platform yet." description="This fills in once businesses bring freelancers onto their workforce." />
      ) : displayRows.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted text-sm">No freelancers match &quot;{q}&quot;.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Business</th>
                <th className="text-left px-4 py-2.5 font-medium">Skill</th>
                <th className="text-left px-4 py-2.5 font-medium">Experience</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((f) => {
                const verified = !!f.freelancer_profiles?.verified_at;
                return (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-ink">{f.full_name}</td>
                    <td className="px-4 py-3 text-ink-muted">{f.organization?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{f.freelancer_profiles?.primary_skill ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {f.freelancer_profiles?.years_experience ? `${f.freelancer_profiles.years_experience} yrs` : "—"}
                    </td>
                    <td className="px-4 py-3 space-x-1.5">
                      <span className={`badge ${verified ? "bg-success-soft text-success" : "bg-sunken text-ink-muted"}`}>
                        {verified ? "Verified" : "Unverified"}
                      </span>
                      {f.suspended_at && <span className="badge bg-danger-soft text-danger">Suspended</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {verified ? (
                        <form action={unverifyFreelancer} className="inline-block">
                          <input type="hidden" name="profile_id" value={f.id} />
                          <SubmitButton variant="outline" pendingLabel="…" className="!px-3 !py-1.5 !text-xs">
                            Unverify
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={verifyFreelancer} className="inline-block">
                          <input type="hidden" name="profile_id" value={f.id} />
                          <SubmitButton variant="primary" pendingLabel="…" className="!px-3 !py-1.5 !text-xs">
                            Verify
                          </SubmitButton>
                        </form>
                      )}
                      {f.suspended_at ? (
                        <form action={reactivateUser} className="inline-block">
                          <input type="hidden" name="profile_id" value={f.id} />
                          <SubmitButton variant="outline" pendingLabel="…" className="!px-3 !py-1.5 !text-xs">
                            Reactivate
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={suspendUser} className="inline-block">
                          <input type="hidden" name="profile_id" value={f.id} />
                          <SubmitButton variant="danger" pendingLabel="…" className="!px-3 !py-1.5 !text-xs">
                            Suspend
                          </SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
