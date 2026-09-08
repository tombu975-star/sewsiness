import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { createTrainingSession } from "./actions";
import Link from "next/link";

function formatDateHeading(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-indigo-soft text-indigo",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger-soft text-danger",
};

export default async function TrainingSessionsPage() {
  const { user, profile } = await requirePageRegistryFeature(
    ["owner", "manager", "trainer", "apprentice"],
    "apprentices"
  );
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager" || profile.role === "trainer";

  const [{ data: sessions }, { data: programs }, { data: apprentices }, { data: myAttendance }] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("id, title, description, location, starts_at, ends_at, status, capacity, program_id, trainer:trainer_id(full_name), program:program_id(name)")
      .eq("organization_id", profile.organization_id)
      .order("starts_at", { ascending: true }),
    canManage
      ? supabase.from("training_programs").select("id, name").eq("organization_id", profile.organization_id).eq("is_active", true)
      : Promise.resolve({ data: [] as any[] }),
    canManage
      ? supabase.from("profiles").select("id, full_name").eq("organization_id", profile.organization_id).eq("role", "apprentice").order("full_name")
      : Promise.resolve({ data: [] as any[] }),
    profile.role === "apprentice"
      ? supabase.from("session_attendance").select("session_id, status").eq("apprentice_id", user.id)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  let visibleSessions = (sessions ?? []) as any[];
  const myAttendanceBySession = new Map((myAttendance ?? []).map((a: any) => [a.session_id, a.status]));

  if (profile.role === "apprentice") {
    visibleSessions = visibleSessions.filter((s) => myAttendanceBySession.has(s.id));
  }

  const groups = new Map<string, any[]>();
  for (const s of visibleSessions) {
    const key = new Date(s.starts_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div>
      <PageHead
        title="Training Sessions"
        subtitle="Scheduled classes and workshops with a roster and attendance."
        crumb="Learning"
      />

      {canManage && (
        <form action={createTrainingSession} className="card p-5 mb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="field-label">Session title</label>
              <input name="title" required placeholder="e.g. Overlocking technique workshop" className="field-input" />
            </div>
            <div>
              <label className="field-label">Linked program (optional)</label>
              <select name="program_id" className="field-input">
                <option value="">None</option>
                {(programs ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Location</label>
              <input name="location" placeholder="e.g. Main workshop" className="field-input" />
            </div>
            <div>
              <label className="field-label">Starts</label>
              <input name="starts_at" type="datetime-local" required className="field-input" />
            </div>
            <div>
              <label className="field-label">Ends</label>
              <input name="ends_at" type="datetime-local" required className="field-input" />
            </div>
            <div>
              <label className="field-label">Capacity (optional)</label>
              <input name="capacity" type="number" min="1" placeholder="No limit" className="field-input" />
            </div>
          </div>
          <div>
            <label className="field-label">Invite apprentices</label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-border p-3 max-h-40 overflow-y-auto">
              {(apprentices ?? []).length === 0 && <span className="text-xs text-ink-muted">No apprentices yet.</span>}
              {(apprentices ?? []).map((a: any) => (
                <label key={a.id} className="flex items-center gap-1.5 text-xs font-medium text-ink-muted bg-sunken rounded-full px-2.5 py-1.5 cursor-pointer">
                  <input type="checkbox" name="apprentice_ids" value={a.id} className="w-3.5 h-3.5 accent-gold" />
                  {a.full_name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea name="description" rows={2} placeholder="What will this session cover?" className="field-input" />
          </div>
          <SubmitButton>Schedule session</SubmitButton>
        </form>
      )}

      {visibleSessions.length === 0 ? (
        <EmptyState
          icon="◔"
          title="No sessions scheduled."
          description={canManage ? "Schedule the first training session for your learners." : "You have no upcoming sessions yet."}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([dateKey, daySessions]) => (
            <div key={dateKey}>
              <h3 className="section-label mb-2">{formatDateHeading(daySessions[0].starts_at)}</h3>
              <div className="space-y-2">
                {daySessions.map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/training-sessions/${s.id}`}
                    className="card card-hover p-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink">{s.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                        {s.location ? ` · ${s.location}` : ""}
                        {s.trainer?.full_name ? ` · Trainer: ${s.trainer.full_name}` : ""}
                        {s.program?.name ? ` · ${s.program.name}` : ""}
                      </div>
                    </div>
                    {profile.role === "apprentice" && myAttendanceBySession.has(s.id) && (
                      <span className="rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold text-ink-muted capitalize">
                        {myAttendanceBySession.get(s.id)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
