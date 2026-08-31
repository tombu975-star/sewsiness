import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { logIncident, setIncidentStatus } from "./actions";
import { requirePageRole } from "@/lib/auth/require-role";

const SEVERITY_TONE: Record<string, string> = {
  low: "bg-sunken text-ink-muted",
  medium: "bg-warning-soft text-warning",
  high: "bg-danger-soft text-danger",
  critical: "bg-burgundy text-white",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-danger-soft text-danger",
  investigating: "bg-warning-soft text-warning",
  resolved: "bg-success-soft text-success",
};

export default async function IncidentsPage() {
  await requirePageRole(["system_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_incidents")
    .select("id, title, description, area, severity, status, detected_at, resolved_at")
    .order("detected_at", { ascending: false });

  const incidents = (data ?? []) as any[];
  const open = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div>
      <PageHead
        title="Incidents"
        subtitle="Track something broken or degraded from the moment you notice it to the moment it's fixed — ideally before a business ever files a support request about it."
        crumb="System Admin"
      />

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load incidents ({error.message}). Make sure{" "}
          <code className="font-mono">supabase/migrations/009_system_admin.sql</code> has been run.
        </div>
      )}

      <div className="card p-4 mb-5">
        <div className="font-display font-semibold text-sm text-ink mb-3">Log an issue</div>
        <form action={logIncident} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
          <input
            name="title"
            required
            placeholder="What's wrong? (e.g. Sign-out spinner hangs on Android)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface md:col-span-2"
          />
          <input
            name="area"
            placeholder="Area (e.g. Auth, POS, Payments)"
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface"
          />
          <select name="severity" defaultValue="medium" className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea
            name="description"
            placeholder="Details (optional)"
            rows={2}
            className="px-3 py-2 rounded-lg border border-border-strong text-sm bg-surface md:col-span-3"
          />
          <SubmitButton pendingLabel="Logging…">+ Log Issue</SubmitButton>
        </form>
      </div>

      {!error && incidents.length === 0 ? (
        <EmptyState icon="\u26A0" title="No incidents logged." description="Nothing tracked yet — log one above when you spot something." />
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Open &amp; investigating ({open.length})</div>
              <div className="space-y-2">
                {open.map((i) => (
                  <IncidentRow key={i.id} incident={i} />
                ))}
              </div>
            </div>
          )}
          {resolved.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Resolved ({resolved.length})</div>
              <div className="space-y-2">
                {resolved.map((i) => (
                  <IncidentRow key={i.id} incident={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentRow({ incident: i }: { incident: any }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${SEVERITY_TONE[i.severity] ?? SEVERITY_TONE.medium}`}>{i.severity}</span>
            <span className={`badge ${STATUS_TONE[i.status] ?? STATUS_TONE.open}`}>{i.status}</span>
            {i.area && <span className="text-xs text-ink-muted">{i.area}</span>}
          </div>
          <div className="font-medium text-ink text-sm">{i.title}</div>
          {i.description && <div className="text-xs text-ink-muted mt-1 max-w-xl">{i.description}</div>}
          <div className="text-[11px] text-ink-faint mt-1.5">
            Detected {new Date(i.detected_at).toLocaleString()}
            {i.resolved_at && ` · Resolved ${new Date(i.resolved_at).toLocaleString()}`}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {i.status !== "investigating" && i.status !== "resolved" && (
            <form action={setIncidentStatus}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="status" value="investigating" />
              <SubmitButton variant="outline" pendingLabel="Updating…" className="!px-3 !py-1.5 !text-xs">
                Investigating
              </SubmitButton>
            </form>
          )}
          {i.status !== "resolved" && (
            <form action={setIncidentStatus}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="status" value="resolved" />
              <SubmitButton pendingLabel="Resolving…" className="!px-3 !py-1.5 !text-xs">
                Mark resolved
              </SubmitButton>
            </form>
          )}
          {i.status === "resolved" && (
            <form action={setIncidentStatus}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="status" value="open" />
              <SubmitButton variant="outline" pendingLabel="Reopening…" className="!px-3 !py-1.5 !text-xs">
                Reopen
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
