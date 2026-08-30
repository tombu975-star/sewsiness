import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import type { BusinessDirectoryRow } from "@/lib/types";

function healthTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-danger";
}

export default async function PlatformAdminPage() {
  const supabase = createClient();

  const [{ data, error }, { data: pendingOrgs }] = await Promise.all([
    supabase.rpc("get_business_directory"),
    supabase
      .from("organizations")
      .select("id, name, region, verification_submitted_at")
      .eq("verification_status", "pending")
      .order("verification_submitted_at", { ascending: true }),
  ]);
  const businesses = (data ?? []) as BusinessDirectoryRow[];

  const totalUsers = businesses.reduce((sum, b) => sum + (b.total_users ?? 0), 0);
  const needingAttention = businesses.filter((b) => b.health_score < 55 || b.orders_overdue > 0).length;
  const avgHealth = businesses.length
    ? Math.round(businesses.reduce((sum, b) => sum + (b.health_score ?? 0), 0) / businesses.length)
    : 0;

  return (
    <div>
      <PageHead
        title="Enrolled Businesses"
        subtitle="Every tailoring business on Sewsiness, with operational health signals only — never revenue, invoices or customer records."
        crumb="Platform Admin"
        actions={<Button href="/admin/new">+ Enroll Business</Button>}
      />

      {!!pendingOrgs?.length && (
        <div className="card p-4 mb-6 border-warning/30 bg-warning-soft/40">
          <h3 className="font-display text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="text-warning">⏳</span> Pending identity verification ({pendingOrgs.length})
          </h3>
          <div className="space-y-2">
            {pendingOrgs.map((o) => (
              <a
                key={o.id}
                href={`/admin/${o.id}`}
                className="flex items-center justify-between bg-surface rounded-sm px-3 py-2.5 border border-border hover:border-border-strong transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">{o.name}</div>
                  <div className="text-xs text-ink-muted">{o.region || "No region set"}</div>
                </div>
                <span className="text-xs font-semibold text-indigo">Review Ghana Card →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Businesses" value={businesses.length} />
        <StatCard label="Active Users" value={totalUsers} />
        <StatCard label="Needs Attention" value={needingAttention} accent />
        <StatCard label="Avg. Health Score" value={`${avgHealth}/100`} accent />
      </div>

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load the business directory ({error.message}). If this is a fresh database, make sure
          you&rsquo;ve run <code className="font-mono">supabase/migrations/002_platform_admin.sql</code> in the
          Supabase SQL editor.
        </div>
      )}

      {!error && businesses.length === 0 ? (
        <EmptyState
          icon="⌂"
          title="No businesses enrolled yet."
          description="Enroll your first tailoring business — this creates their workspace and invites their Owner."
          actionLabel="Enroll Business"
          actionHref="/admin/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {businesses.map((b) => (
            <a key={b.organization_id} href={`/admin/${b.organization_id}`} className="card p-4 hover:border-border-strong transition-colors block">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-display font-semibold text-ink text-[15px]">{b.organization_name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {b.region || "No region set"} · {b.owner_name ? `Owner: ${b.owner_name}` : "No owner yet"}
                  </div>
                </div>
                <span
                  className={`badge ${b.status === "Active" ? "bg-success-soft text-success" : "bg-sunken text-ink-muted"}`}
                >
                  {b.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ink-muted mt-3 pt-3 border-t border-border">
                <span>{b.orders_in_progress} in progress</span>
                <span className={b.orders_overdue > 0 ? "text-danger font-semibold" : ""}>
                  {b.orders_overdue} overdue
                </span>
                <span>{b.total_users} users</span>
                <span className={`ml-auto font-mono font-semibold ${healthTone(b.health_score)}`}>
                  {b.health_score}/100
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
