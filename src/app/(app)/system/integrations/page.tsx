import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { runIntegrationCheck, addIntegration, removeIntegration } from "./actions";
import { requirePageRole } from "@/lib/auth/require-role";

const STATUS_TONE: Record<string, string> = {
  connected: "bg-success-soft text-success",
  error: "bg-danger-soft text-danger",
  not_configured: "bg-warning-soft text-warning",
  unknown: "bg-sunken text-ink-muted",
};

const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  error: "Error",
  not_configured: "Not configured",
  unknown: "Not checked yet",
};

export default async function IntegrationsPage() {
  await requirePageRole(["system_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("integration_checks")
    .select("id, provider_key, provider_name, category, docs_url, required_env_vars, status, last_checked_at, last_message")
    .order("category")
    .order("provider_name");

  const integrations = (data ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Integrations"
        subtitle="What Sewsiness connects to, and whether the env vars each one needs are actually set on this deployment. No secret values are ever stored or shown here — real keys stay in Render's environment settings."
        crumb="System Admin"
      />

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load integrations ({error.message}). Make sure{" "}
          <code className="font-mono">supabase/migrations/009_system_admin.sql</code> has been run.
        </div>
      )}

      <div className="card p-4 mb-5">
        <div className="font-display font-semibold text-sm text-ink mb-3">Add a provider</div>
        <form action={addIntegration} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
          <input
            name="provider_key"
            required
            placeholder="key (e.g. sms_hub)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface font-mono"
          />
          <input
            name="provider_name"
            required
            placeholder="Name (e.g. SMS Hub)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface"
          />
          <input
            name="category"
            placeholder="Category (e.g. Messaging)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface"
          />
          <input
            name="required_env_vars"
            placeholder="Env vars, comma-separated"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface font-mono"
          />
          <SubmitButton pendingLabel="Adding…">+ Add</SubmitButton>
          <input
            name="docs_url"
            placeholder="Docs URL (optional)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface md:col-span-4"
          />
        </form>
      </div>

      {!error && integrations.length === 0 ? (
        <EmptyState icon="\u2699" title="No integrations tracked yet." description="Add one above to start monitoring it." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.map((i) => (
            <div key={i.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-display font-semibold text-ink text-[15px]">{i.provider_name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{i.category}</div>
                </div>
                <span className={`badge ${STATUS_TONE[i.status] ?? STATUS_TONE.unknown}`}>
                  {STATUS_LABEL[i.status] ?? i.status}
                </span>
              </div>

              {i.required_env_vars?.length > 0 && (
                <div className="text-xs text-ink-muted mb-2">
                  Needs:{" "}
                  {i.required_env_vars.map((v: string) => (
                    <code key={v} className="font-mono bg-sunken px-1.5 py-0.5 rounded mr-1 inline-block mb-1">
                      {v}
                    </code>
                  ))}
                </div>
              )}

              {i.last_message && <div className="text-xs text-ink-muted mb-2">{i.last_message}</div>}

              <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                <span className="text-[11px] text-ink-faint">
                  {i.last_checked_at ? `Checked ${new Date(i.last_checked_at).toLocaleString()}` : "Never checked"}
                </span>
                <div className="flex items-center gap-2">
                  {i.docs_url && (
                    <a href={i.docs_url} target="_blank" rel="noreferrer" className="text-xs text-ink-muted hover:text-ink underline">
                      Docs
                    </a>
                  )}
                  <form action={runIntegrationCheck}>
                    <input type="hidden" name="id" value={i.id} />
                    <SubmitButton variant="outline" pendingLabel="Checking…" className="!px-3 !py-1.5 !text-xs">
                      Recheck
                    </SubmitButton>
                  </form>
                  <form action={removeIntegration}>
                    <input type="hidden" name="id" value={i.id} />
                    <SubmitButton variant="danger" pendingLabel="Removing…" className="!px-3 !py-1.5 !text-xs">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
