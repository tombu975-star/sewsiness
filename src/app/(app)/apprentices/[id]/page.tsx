import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";
import { MarkTrainingCompleteButton } from "../MarkTrainingCompleteButton";

export default async function ApprenticeDetailPage({ params }: { params: { id: string } }) {
  const { profile } = await requirePageRole(["owner", "manager", "trainer"]);
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

  const { data: ap } = await supabase
    .from("apprentice_profiles")
    .select(
      "training_level, specialisation, training_goals, start_date, completed_at, certificate_number, trainer:trainer_id(full_name)"
    )
    .eq("profile_id", params.id)
    .maybeSingle();

  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("id, title, description, image_url, created_at")
    .eq("apprentice_id", params.id)
    .order("created_at", { ascending: false });

  const rows = (portfolio ?? []) as any[];
  const isCompleted = Boolean(ap?.completed_at);

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
            <dd className="text-ink text-right">{(ap as any)?.trainer?.full_name ?? "Not assigned"}</dd>
            <dt className="text-ink-muted">Training Level</dt>
            <dd className="text-ink text-right">{ap?.training_level ?? "—"}</dd>
            <dt className="text-ink-muted">Specialisation</dt>
            <dd className="text-ink text-right">{ap?.specialisation ?? "—"}</dd>
            <dt className="text-ink-muted">Start Date</dt>
            <dd className="text-ink text-right">{ap?.start_date ?? "—"}</dd>
            {ap?.training_goals && (
              <>
                <dt className="text-ink-muted">Goals</dt>
                <dd className="text-ink text-right">{ap.training_goals}</dd>
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
                {ap?.completed_at
                  ? new Date(ap.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  : ""}
              </p>
              <p className="text-xs text-ink-muted mb-4">Certificate No. {ap?.certificate_number ?? "—"}</p>
              <a
                href={`/apprentices/${params.id}/certificate`}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 bg-gold text-[#3a2400] hover:brightness-[1.03] border border-gold transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: "var(--shadow-gold)" }}
              >
                Download Certificate
              </a>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-muted mb-4">
                Training is still in progress. Mark it complete once the apprentice has finished — this issues a
                certificate with a unique number and can&rsquo;t be undone.
              </p>
              <MarkTrainingCompleteButton apprenticeId={params.id} />
            </div>
          )}
        </div>
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
