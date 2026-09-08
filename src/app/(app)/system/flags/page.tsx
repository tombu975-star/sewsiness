import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { FEATURE_REGISTRY, DEFAULT_OFF_FEATURE_KEYS } from "@/lib/nav";
import { createFeatureFlag, toggleFeatureFlag, toggleRegistryFeature, deleteFeatureFlag } from "./actions";

export default async function FeatureFlagsPage() {
  await requirePageRole(["system_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("id, key, label, description, enabled, updated_at")
    .order("label");

  const allFlags = (data ?? []) as any[];
  const flagsByKey = new Map(allFlags.map((f) => [f.key as string, f]));
  const registryKeys = new Set(FEATURE_REGISTRY.map((f) => f.key));

  // Every platform module (src/lib/nav.ts FEATURE_REGISTRY) shows up here
  // whether or not it has a feature_flags row yet — a missing row means
  // "already live, never explicitly touched", not "off". Grouped the
  // same way the sidebar groups them, so the layout on this page reads
  // like a map of the whole app rather than an alphabetical dump.
  const categories = Array.from(new Set(FEATURE_REGISTRY.map((f) => f.category)));

  // Flags that exist in the database but aren't a real platform module —
  // e.g. one-off flags a developer created directly with isFeatureEnabled()
  // for work in progress that isn't wired into the sidebar at all. These
  // keep the original create/toggle/delete-by-id flow below.
  const customFlags = allFlags.filter((f) => !registryKeys.has(f.key));

  return (
    <div>
      <PageHead
        title="Feature Flags"
        subtitle="Decide which parts of Sewsiness are live for every business. Turning a module off here hides it from the sidebar and mobile menu for every role that would otherwise see it — no redeploy needed."
        crumb="System Admin"
      />

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load feature flags ({error.message}). Make sure{" "}
          <code className="font-mono">supabase/migrations/009_system_admin.sql</code> has been run.
        </div>
      )}

      {categories.map((category) => {
        const rows = FEATURE_REGISTRY.filter((f) => f.category === category);
        return (
          <div key={category} className="card overflow-hidden mb-5">
            <div className="px-4 py-2.5 bg-sunken border-b border-border">
              <div className="font-display font-semibold text-sm text-ink">{category}</div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((reg) => {
                  const flag = flagsByKey.get(reg.key);
                  // No row yet: most modules were already live before flags
                  // existed, so that means ON. The handful in
                  // DEFAULT_OFF_FEATURE_KEYS were built opt-in from day one
                  // (their page-level block already defaults missing to
                  // OFF) — this has to mirror that or the status shown here
                  // would lie about what actually happens when someone
                  // opens the page.
                  const enabled = flag ? flag.enabled : !DEFAULT_OFF_FEATURE_KEYS.has(reg.key);
                  return (
                    <tr key={reg.key} className="border-t border-border first:border-t-0">
                      <td className="px-4 py-3 w-1/2">
                        <div className="font-medium text-ink">{reg.label}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{reg.description}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono text-xs whitespace-nowrap">{reg.key}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${enabled ? "bg-success-soft text-success" : "bg-sunken text-ink-muted"}`}>
                          {enabled ? "Live" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap">
                        {flag?.updated_at ? new Date(flag.updated_at).toLocaleString() : "Never changed"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <form action={toggleRegistryFeature}>
                          <input type="hidden" name="key" value={reg.key} />
                          <input type="hidden" name="label" value={reg.label} />
                          <input type="hidden" name="description" value={reg.description} />
                          <input type="hidden" name="next_enabled" value={(!enabled).toString()} />
                          <SubmitButton
                            variant={enabled ? "outline" : "primary"}
                            pendingLabel="Updating…"
                            className="!px-3 !py-1.5 !text-xs"
                          >
                            {enabled ? "Take offline" : "Go live"}
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <details className="card p-4 mb-5 text-sm">
        <summary className="font-semibold text-ink cursor-pointer">Custom flags &amp; how to add a new one</summary>
        <div className="text-ink-muted mt-2 space-y-2">
          <p>
            The modules above cover every switchable part of the app today. For a brand-new feature that isn&apos;t
            wired into the sidebar yet, create a custom flag below instead — it starts OFF (hidden) rather than ON,
            since it&apos;s work in progress rather than something already live.
          </p>
          <p>
            In the page or component you want to gate, await{" "}
            <code className="font-mono">isFeatureEnabled(&quot;your_key&quot;)</code> from{" "}
            <code className="font-mono">@/lib/feature-flags</code> and render nothing (or a &ldquo;coming
            soon&rdquo; state) when it returns <code className="font-mono">false</code>. Once it&apos;s ready for
            everyone, either flip it on here or add it to FEATURE_REGISTRY in{" "}
            <code className="font-mono">src/lib/nav.ts</code> to give it a permanent home above.
          </p>
        </div>
      </details>

      <div className="card p-4 mb-5">
        <div className="font-display font-semibold text-sm text-ink mb-3">New custom flag</div>
        <form action={createFeatureFlag} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
          <input
            name="key"
            required
            placeholder="key (e.g. new_experiment)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface font-mono"
          />
          <input
            name="label"
            required
            placeholder="Label (e.g. New Experiment)"
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

      {customFlags.length === 0 ? (
        <EmptyState
          icon="\u2691"
          title="No custom flags."
          description="Every switchable module is listed above. Add a custom flag here only for work-in-progress features that aren't in the sidebar yet."
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
              {customFlags.map((f) => (
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
