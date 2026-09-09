import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { getApprenticeCertificateStatus } from "@/lib/apprentice-certificate";
import { reopenEnrollmentForRetake } from "../../training-plans/actions";
import { AssignTrainerForm } from "./AssignTrainerForm";

export default async function ApprenticeDetailPage({ params }: { params: { id: string } }) {
  const { profile } = await requirePageRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const supabase = createClient();

  const { data: apprentice } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id")
    .eq("id", params.id)
    .single();

  if (!apprentice || apprentice.organization_id !== profile.organization_id) {
    return (
      <EmptyState icon="⚘" title="Apprentice not found." description="They may have been removed, or belong to a different business." />
    );
  }

  // Single source of truth for "is a certificate ready?" — see
  // apprentice-certificate.ts. This used to check apprentice_profiles.
  // completed_at alone, which missed anyone completed through a
  // structured Training Program enrollment (that path issues a real
  // `certificates` row but never sets completed_at) — so a Trainer
  // could never see or open a certificate that had, in fact, already
  // been issued.
  const status = await getApprenticeCertificateStatus(supabase, params.id);

  const canAssignTrainer = profile.role === "owner" || profile.role === "manager";
  let trainers: { id: string; full_name: string }[] = [];
  let currentTrainerId: string | null = null;
  if (canAssignTrainer) {
    const [{ data: trainerRows }, { data: apprenticeProfile }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", profile.organization_id)
        .in("role", ["trainer", "owner", "manager"])
        .order("full_name"),
      supabase.from("apprentice_profiles").select("trainer_id").eq("profile_id", params.id).single(),
    ]);
    trainers = trainerRows ?? [];
    currentTrainerId = apprenticeProfile?.trainer_id ?? null;
  }

  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("id, title, description, image_url, created_at")
    .eq("apprentice_id", params.id)
    .order("created_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("training_tasks")
    .select("id, title, status, score")
    .eq("apprentice_id", params.id)
    .order("created_at", { ascending: false });

  const rows = (portfolio ?? []) as any[];
  const taskRows = (tasks ?? []) as any[];
  const approvedTasks = taskRows.filter((task) => task.status === "Approved").length;
  const isCompleted = status.ready;

  return (
    <div>
      <PageHead
        title={apprentice.full_name}
        subtitle="Training record, certificate, and portfolio."
        crumb="Apprentices"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-display text-[15px] font-semibold text-ink mb-3">Training Record</h3>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-muted">Trainer</dt>
            {canAssignTrainer ? (
              <dd className="text-right">
                <AssignTrainerForm apprenticeId={params.id} currentTrainerId={currentTrainerId} trainers={trainers} />
              </dd>
            ) : (
              <dd className="text-ink text-right">{status.trainerName ?? "Not assigned"}</dd>
            )}
            <dt className="text-ink-muted">Training Level</dt>
            <dd className="text-ink text-right">{status.trainingLevel ?? "—"}</dd>
            <dt className="text-ink-muted">Specialisation</dt>
            <dd className="text-ink text-right">{status.specialisation ?? "—"}</dd>
            <dt className="text-ink-muted">Start Date</dt>
            <dd className="text-ink text-right">{status.startDate ?? "—"}</dd>
            {status.trainingGoals && (
              <>
                <dt className="text-ink-muted">Goals</dt>
                <dd className="text-ink text-right">{status.trainingGoals}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-[15px] font-semibold text-ink mb-3">Completion & Certificate</h3>
          {isCompleted ? (
            <div>
              <p className="text-sm text-success mb-1">
                ✓ Training completed{" "}
                {status.completedAt
                  ? new Date(status.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  : ""}
              </p>
              <p className="text-xs text-ink-muted mb-4">Certificate No. {status.certificateNumber ?? "—"}</p>
              <a
                href={`/apprentices/${params.id}/certificate`}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 bg-indigo text-white hover:brightness-110 border border-indigo transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: "var(--shadow-gold)" }}
              >
                Download Certificate
              </a>
              {rows.length > 0 && (
                <a
                  href={`/portfolios/export?apprentice_id=${params.id}`}
                  className="ml-2 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 border border-border-strong text-ink hover:bg-sunken transition-all duration-150 active:scale-[0.98]"
                >
                  Export Portfolio Book
                </a>
              )}
            </div>
          ) : status.failedEnrollment ? (
            <div>
              <p className="text-sm text-warning mb-1">⚠ Training completed — not yet certified</p>
              <p className="text-xs text-ink-muted mb-4">
                {status.failedEnrollment.programName ?? "This program"} finished with a final score of{" "}
                <strong>{status.failedEnrollment.finalScore != null ? `${Number(status.failedEnrollment.finalScore).toFixed(1)}%` : "—"}</strong>
                {status.failedEnrollment.passScore != null ? ` (pass mark: ${status.failedEnrollment.passScore}%)` : ""} — below the pass mark, so no
                certificate was issued.
              </p>
              <form action={reopenEnrollmentForRetake}>
                <input type="hidden" name="enrollment_id" value={status.failedEnrollment.enrollmentId} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 bg-indigo text-white hover:brightness-110 border border-indigo transition-all duration-150 active:scale-[0.98]"
                >
                  Reopen for Retake
                </button>
              </form>
              <p className="mt-2 text-xs text-ink-faint">
                This reopens the enrollment so the trainer can assign further work. It doesn't change any task's existing score.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-muted mb-4">
                Training is still in progress. The certificate will become available automatically when every assigned
                task has been submitted and approved by the trainer.
              </p>
              <div className="rounded-lg bg-sunken px-3 py-2 text-sm text-ink">
                Progress: <strong>{approvedTasks} / {taskRows.length}</strong> tasks approved
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-6 divide-y divide-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-display text-[15px] font-semibold text-ink">Training Tasks</div>
            {taskRows.length > 0 && (
              <div className="text-xs font-semibold text-ink-muted">
                {approvedTasks} / {taskRows.length} approved
              </div>
            )}
          </div>
          {taskRows.length > 0 && (
            <div className="h-1.5 rounded-full bg-sunken overflow-hidden" role="progressbar" aria-valuenow={approvedTasks} aria-valuemin={0} aria-valuemax={taskRows.length} aria-label="Training tasks approved">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${taskRows.length ? Math.round((approvedTasks / taskRows.length) * 100) : 0}%` }}
              />
            </div>
          )}
        </div>
        {taskRows.length === 0 ? (
          <div className="p-4 text-sm text-ink-muted">No tasks assigned yet.</div>
        ) : taskRows.map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-ink">{task.title}</span>
            <span className="text-xs font-semibold text-ink-muted">{task.status}{task.score !== null ? ` · ${task.score}/100` : ""}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">Portfolio</h2>
        {rows.length > 0 && (
          <a
            href={`/portfolios/export?apprentice_id=${params.id}`}
            className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Export Portfolio (PDF) <span aria-hidden="true">↓</span>
          </a>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="✦" title="No portfolio pieces yet." description="Pieces added for this apprentice will appear here." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="w-full aspect-[4/3] rounded-sm bg-sunken mb-3 overflow-hidden flex items-center justify-center text-ink-faint text-xs">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  "No image yet"
                )}
              </div>
              <div className="font-semibold text-sm text-ink">{p.title}</div>
              {p.description && <p className="text-xs text-ink-muted mt-1.5">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
