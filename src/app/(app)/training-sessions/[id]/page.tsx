import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { markAttendance, updateSessionStatus } from "../actions";

const ATTENDANCE_OPTIONS: { value: string; label: string; style: string }[] = [
  { value: "invited", label: "Invited", style: "bg-sunken text-ink-muted" },
  { value: "present", label: "Present", style: "bg-success/10 text-success" },
  { value: "late", label: "Late", style: "bg-warning/10 text-warning" },
  { value: "absent", label: "Absent", style: "bg-danger-soft text-danger" },
  { value: "excused", label: "Excused", style: "bg-indigo-soft text-indigo" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function TrainingSessionDetailPage({ params }: { params: { id: string } }) {
  const { user, profile } = await requirePageRegistryFeature(
    ["owner", "manager", "trainer", "apprentice"],
    "apprentices"
  );
  const supabase = createClient();
  const canManage = profile.role === "owner" || profile.role === "manager" || profile.role === "trainer";

  const { data: session } = await supabase
    .from("training_sessions")
    .select(
      "id, title, description, location, starts_at, ends_at, status, capacity, trainer:trainer_id(full_name), program:program_id(name)"
    )
    .eq("id", params.id)
    .eq("organization_id", profile.organization_id)
    .single();
  if (!session) notFound();
  const s = session as any;

  const { data: roster } = await supabase
    .from("session_attendance")
    .select("id, status, checked_in_at, apprentice:apprentice_id(id, full_name)")
    .eq("session_id", params.id)
    .order("created_at", { ascending: true });

  const visibleRoster =
    profile.role === "apprentice"
      ? (roster ?? []).filter((r: any) => r.apprentice?.id === user.id)
      : (roster ?? []);

  const presentCount = (roster ?? []).filter((r: any) => r.status === "present" || r.status === "late").length;

  return (
    <div>
      <PageHead
        title={session.title}
        subtitle={`${formatDateTime(session.starts_at)} – ${formatDateTime(session.ends_at)}${session.location ? ` · ${session.location}` : ""}`}
        crumb="Training Sessions"
      />

      <div className="card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-ink-muted">
          {s.trainer?.full_name ? `Trainer: ${s.trainer.full_name}` : "No trainer assigned"}
          {s.program?.name ? ` · Program: ${s.program.name}` : ""}
          {session.capacity ? ` · Capacity: ${presentCount}/${session.capacity}` : ""}
        </div>
        {canManage && (
          <form action={updateSessionStatus} className="flex items-center gap-2">
            <input type="hidden" name="session_id" value={session.id} />
            <select name="status" defaultValue={session.status} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="field-input !py-1.5 !text-xs">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </form>
        )}
      </div>

      {session.description && <p className="text-sm text-ink-muted mb-6 max-w-2xl">{session.description}</p>}

      <h3 className="section-label mb-2">{profile.role === "apprentice" ? "My attendance" : "Roster & attendance"}</h3>
      {visibleRoster.length === 0 ? (
        <p className="text-sm text-ink-muted">No one has been invited to this session yet.</p>
      ) : (
        <div className="space-y-2">
          {visibleRoster.map((r: any) => (
            <div key={r.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="font-semibold text-ink text-sm">{r.apprentice?.full_name ?? "Unknown"}</div>
              {canManage ? (
                <form action={markAttendance} className="flex items-center gap-2">
                  <input type="hidden" name="attendance_id" value={r.id} />
                  <input type="hidden" name="session_id" value={session.id} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="field-input !py-1.5 !text-xs"
                  >
                    {ATTENDANCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </form>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ATTENDANCE_OPTIONS.find((o) => o.value === r.status)?.style ?? "bg-sunken text-ink-muted"}`}>
                  {r.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
