import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";

export default async function SystemOverviewPage() {
  await requirePageRole(["system_admin"]);
  const supabase = createClient();

  const [{ data: flags }, { data: integrations }, { data: incidents }] = await Promise.all([
    supabase.from("feature_flags").select("enabled"),
    supabase.from("integration_checks").select("status"),
    supabase.from("system_incidents").select("status, severity"),
  ]);

  const flagRows = (flags ?? []) as { enabled: boolean }[];
  const integrationRows = (integrations ?? []) as { status: string }[];
  const incidentRows = (incidents ?? []) as { status: string; severity: string }[];

  const liveFlags = flagRows.filter((f) => f.enabled).length;
  const integrationsWithIssues = integrationRows.filter((i) => i.status === "error" || i.status === "not_configured").length;
  const openIncidents = incidentRows.filter((i) => i.status !== "resolved").length;
  const criticalOpen = incidentRows.filter((i) => i.status !== "resolved" && i.severity === "critical").length;

  return (
    <div>
      <PageHead
        title="System Overview"
        subtitle="Your technical workspace — what's live, what's connected, and what's broken. No business or customer data lives here."
        crumb="System Admin"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Flags Live" value={`${liveFlags}/${flagRows.length}`} />
        <StatCard label="Integrations Needing Attention" value={integrationsWithIssues} accent={integrationsWithIssues > 0} />
        <StatCard label="Open Incidents" value={openIncidents} accent={openIncidents > 0} />
        <StatCard label="Critical & Open" value={criticalOpen} accent={criticalOpen > 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a href="/system/flags" className="card p-5 hover:border-border-strong transition-colors block">
          <div className="text-xl mb-2">&#9873;</div>
          <div className="font-display font-semibold text-ink text-[15px] mb-1">Feature Flags</div>
          <p className="text-xs text-ink-muted">Turn parts of the system on or off before users see them.</p>
        </a>
        <a href="/system/integrations" className="card p-5 hover:border-border-strong transition-colors block">
          <div className="text-xl mb-2">&#9881;</div>
          <div className="font-display font-semibold text-ink text-[15px] mb-1">Integrations</div>
          <p className="text-xs text-ink-muted">Check whether each third-party provider's env vars are set.</p>
        </a>
        <a href="/system/incidents" className="card p-5 hover:border-border-strong transition-colors block">
          <div className="text-xl mb-2">&#9888;</div>
          <div className="font-display font-semibold text-ink text-[15px] mb-1">Incidents</div>
          <p className="text-xs text-ink-muted">Log and track issues from detection through to resolution.</p>
        </a>
      </div>

      {(flags === null || integrations === null || incidents === null) && (
        <div className="callout mt-5">
          Some System Admin data couldn&rsquo;t load. Make sure{" "}
          <code className="font-mono">supabase/migrations/009_system_admin.sql</code> has been run, and that this
          account's <code className="font-mono">profiles.role</code> is <code className="font-mono">system_admin</code>.
        </div>
      )}
    </div>
  );
}
