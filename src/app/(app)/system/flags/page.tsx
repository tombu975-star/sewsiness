import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { createFeatureFlag, toggleFeatureFlag, deleteFeatureFlag } from "./actions";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function FeatureFlagsPage() {
  await requirePageRole(["system_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("id, key, label, description, enabled, updated_at")
    .order("label");

  const flags = (data ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Feature Flags"
        subtitle="Decide which parts of Sewsiness are live. A flag reads as OFF (hidden) anywhere it's checked in code until you turn it on here — see src/lib/feature-flags.ts."
        crumb="System Admin"
      />

      <details className="card p-4 mb-5 text-sm">
        <summary className="font-semibold text-ink cursor-pointer">How to gate a feature with a flag</summary>
        <div className="text-ink-muted mt-2 space-y-2">
          <p>
            1. Create a flag below with a short <code className="font-mono">key</code> (e.g.{" "}
            <code className="font-mono">dressmaking_collections</code>). It starts OFF.
          </p>
          <p>
            2. In the page or component you want to gate, await{" "}
            <code className="font-mono">isFeatureEnabled(&quot;your_key&quot;)</code> from{" "}
            <code className="font-mono">@/lib/feature-flags</code> and render nothing (or a &ldquo;coming
            soon&rdquo; state) when it returns <code className="font-mono">false</code>.
          </p>
          <p>3. Flip it on here whenever you're ready — no redeploy needed, it takes effect immediately.</p>
        </div>
      </details>

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load feature flags ({error.message}). Make sure{" "}
          <code className="font-mono">supabase/migrations/009_system_admin.sql</code> has been run.
        </div>
      )}

      <div className="card p-4 mb-5">
        <div className="font-display font-semibold text-sm text-ink mb-3">New flag</div>
        <form action={createFeatureFlag} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
          <input
            name="key"
            required
            placeholder="key (e.g. dressmaking_collections)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface font-mono"
          />
          <input
            name="label"
            required
            placeholder="Label (e.g. Collections)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface md:col-span-1"
          />
          <SubmitButton pendingLabel="Creating…">+ Add Flag</SubmitButton>
        </form>
      </div>

      {!error && flags.length === 0 ? (
        <EmptyState
          icon="\u2691"
          title="No feature flags yet."
          description="Create one above to start gating a feature in the app."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Flag</th>
                <th className="text-left px-4 py-2.5 font-medium">Key</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Last updated</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{f.label}</div>
                    {f.description && <div className="text-xs text-ink-muted mt-0.5">{f.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-muted font-mono text-xs">{f.key}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${f.enabled ? "bg-success-soft text-success" : "bg-sunken text-ink-muted"}`}>
                      {f.enabled ? "Live" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs">{new Date(f.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleFeatureFlag}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="next_enabled" value={(!f.enabled).toString()} />
                        <SubmitButton
                          variant={f.enabled ? "outline" : "primary"}
                          pendingLabel="Updating…"
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          {f.enabled ? "Turn off" : "Turn on"}
                        </SubmitButton>
                      </form>
                      <form action={deleteFeatureFlag}>
                        <input type="hidden" name="id" value={f.id} />
                        <SubmitButton variant="danger" pendingLabel="Removing…" className="!px-3 !py-1.5 !text-xs">
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
