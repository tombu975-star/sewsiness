import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import type { AdvisoryNote, BusinessDirectoryRow } from "@/lib/types";
import { pauseBusiness, sendAdvisoryNote } from "../actions";

const STAGE_COLORS: Record<string, string> = {
  Cutting: "#FBBF24",
  Sewing: "#A855F7",
  Finishing: "#4B1878",
  Pressing: "#B4433D",
  Ready: "#3F7A5D",
};

function healthTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-danger";
}

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: directory, error: dirErr }, { data: stages }, { data: notes }] = await Promise.all([
    supabase.rpc("get_business_directory"),
    supabase.rpc("get_business_stage_breakdown", { target_org: params.id }),
    supabase
      .from("advisory_notes")
      .select("id, organization_id, author_id, message, created_at, seen_at")
      .eq("organization_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (dirErr) {
    return (
      <div>
        <PageHead title="Business" crumb="Platform Admin" />
        <div className="callout">
          Couldn&rsquo;t load this business ({dirErr.message}). Make sure
          <code className="font-mono"> supabase/migrations/002_platform_admin.sql</code> has been run.
        </div>
      </div>
    );
  }

  const business = (directory as BusinessDirectoryRow[] | null)?.find((b) => b.organization_id === params.id);
  if (!business) notFound();

  const stageBreakdown = (stages ?? []) as { stage: string; order_count: number }[];
  const maxStageCount = Math.max(1, ...stageBreakdown.map((s) => s.order_count));

  return (
    <div>
      <PageHead
        title={business.organization_name}
        subtitle={`${business.region || "No region set"} · ${business.plan} plan · Enrolled ${new Date(business.enrolled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
        crumb="Platform Admin / Enrolled Businesses"
        actions={
          <>
            <Button href="/admin" variant="outline">
              ← All Businesses
            </Button>
            <form action={pauseBusiness}>
              <input type="hidden" name="organization_id" value={business.organization_id} />
              <input type="hidden" name="next_status" value={business.status === "Active" ? "Paused" : "Active"} />
              <SubmitButton variant={business.status === "Active" ? "danger" : "primary"} pendingLabel="Updating…">
                {business.status === "Active" ? "Pause Business" : "Reactivate Business"}
              </SubmitButton>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Health Score" value={<span className={healthTone(business.health_score)}>{business.health_score}/100</span>} />
        <StatCard label="Orders In Progress" value={business.orders_in_progress} />
        <StatCard label="Orders Overdue" value={business.orders_overdue} accent={business.orders_overdue > 0} />
        <StatCard label="QC Pass Rate" value={business.qc_checks_run > 0 ? `${business.qc_pass_rate}%` : "No checks yet"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h3 className="font-display text-[15px] font-semibold text-ink mb-4">Production, by stage</h3>
            <div className="space-y-3">
              {stageBreakdown.map((s) => (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-16 text-xs font-semibold text-ink-muted shrink-0">{s.stage}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-sunken overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.order_count / maxStageCount) * 100}%`,
                        background: STAGE_COLORS[s.stage],
                      }}
                    />
                  </div>
                  <div className="w-6 text-right text-xs font-mono font-semibold text-ink">{s.order_count}</div>
                </div>
              ))}
              {stageBreakdown.every((s) => s.order_count === 0) && (
                <div className="text-sm text-ink-muted text-center py-4">Nothing in production right now.</div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-[15px] font-semibold text-ink mb-1">What Super Admin can&rsquo;t see</h3>
            <p className="text-xs text-ink-muted mb-3">
              By design — enforced on the backend, not just hidden in this UI.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["Revenue & invoices", "Customer records", "Staff pay & expenses", "Measurements & designs"].map((x) => (
                <div key={x} className="flex items-center gap-2 text-ink-muted">
                  <span className="text-ink-faint">🔒</span> {x}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-5 mb-4">
            <h3 className="font-display text-[15px] font-semibold text-ink mb-1">At a glance</h3>
            <dl className="text-sm space-y-2.5 mt-3">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Owner</dt>
                <dd className="font-medium text-ink">{business.owner_name ?? "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Users</dt>
                <dd className="font-medium text-ink">{business.total_users}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Total orders</dt>
                <dd className="font-medium text-ink">{business.orders_total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">QC checks run</dt>
                <dd className="font-medium text-ink">{business.qc_checks_run}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-[15px] font-semibold text-ink mb-3">Advisory notes</h3>
            <form action={sendAdvisoryNote} className="space-y-2 mb-4">
              <input type="hidden" name="organization_id" value={business.organization_id} />
              <textarea
                name="message"
                required
                rows={3}
                placeholder="Send a note to this business's Owner…"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold resize-none"
              />
              <SubmitButton pendingLabel="Sending…" className="w-full">
                Send Note
              </SubmitButton>
            </form>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {((notes ?? []) as AdvisoryNote[]).length === 0 && (
                <div className="text-sm text-ink-muted text-center py-4">No notes sent yet.</div>
              )}
              {((notes ?? []) as AdvisoryNote[]).map((n) => (
                <div key={n.id} className="text-sm border-l-2 border-gold pl-3 py-0.5">
                  <p className="text-ink">{n.message}</p>
                  <div className="text-[11px] text-ink-faint mt-1">
                    {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {n.seen_at ? " · Seen" : " · Unseen"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
