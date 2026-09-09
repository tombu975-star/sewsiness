import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { getApprenticeCertificateStatus } from "@/lib/apprentice-certificate";

// An Apprentice sees none of the shop's money or its full customer/order
// list — their sidebar reaches exactly three things (My Training i.e.
// this page, My Tasks, My Portfolio; see SIDEBAR in nav.ts), so this
// dashboard is scoped to those three: who's training them, what's
// assigned, and what they've made.
export async function ApprenticeDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();

  // Single source of truth for "is a certificate ready?" — see
  // apprentice-certificate.ts.
  const [{ data: tasks }, { data: portfolio }, status] = await Promise.all([
    supabase
      .from("training_tasks")
      .select("id, title, status, due_date")
      .eq("apprentice_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("portfolio_items")
      .select("id, title, image_url, created_at")
      .eq("apprentice_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    getApprenticeCertificateStatus(supabase, userId),
  ]);

  const taskRows = (tasks ?? []) as any[];
  const doneCount = taskRows.filter((t) => t.status === "Approved").length;
  const openTasks = taskRows.filter((t) => t.status !== "Approved").slice(0, 6);
  const completed = status.ready;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        crumb={`Apprentice · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle="Your training progress and assigned tasks."
        actions={
          <>
            {completed && (
              <a
                href={`/apprentices/${userId}/certificate`}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-4 py-2.5 bg-indigo text-white hover:brightness-110 border border-indigo transition-all duration-150 active:scale-[0.98]"
                style={{ boxShadow: "var(--shadow-gold)" }}
              >
                Download Certificate
              </a>
            )}
            <Button href="/portfolios" variant="outline">
              My Portfolio
            </Button>
          </>
        }
      />

      {completed && (
        <div className="callout mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5">Training Completed 🎓</div>
          <p>
            Certificate No. {status.certificateNumber ?? "—"}{status.structured?.grade ? ` · ${status.structured.grade}` : ""}{status.structured?.finalScore != null ? ` · ${Number(status.structured.finalScore).toFixed(1)}%` : ""} — you can download it any time from the button
            above.
            {(portfolio ?? []).length > 0 && (
              <>
                {" "}
                You can also{" "}
                <a href="/portfolios/export" className="font-semibold underline">
                  export your portfolio as a printable book (PDF)
                </a>
                .
              </>
            )}
          </p>
        </div>
      )}

      {!completed && status.failedEnrollment && (
        <div className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5">Not yet certified</div>
          <p>
            {status.failedEnrollment.programName ?? "This program"} is complete, but the final score
            {status.failedEnrollment.finalScore != null ? ` (${Number(status.failedEnrollment.finalScore).toFixed(1)}%)` : ""} didn't reach the pass mark, so a
            certificate wasn't issued. Speak to your trainer about next steps.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">My Trainer</div>
          <div className="font-display text-lg font-semibold text-ink">{status.trainerName ?? "Not yet assigned"}</div>
        </div>
        <StatCard label="Training Level" value={status.trainingLevel ?? "—"} icon="◎" />
        <StatCard label="Tasks Done" value={`${doneCount} / ${taskRows.length}`} accent icon="✓" />
      </div>

      {(status.specialisation || status.trainingGoals) && (
        <div className="card p-5 mb-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h3 className="font-display text-[15px] font-semibold text-ink mb-3">About your training</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {status.specialisation && (
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Specialisation</dt>
                <dd className="text-ink">{status.specialisation}</dd>
              </div>
            )}
            {status.trainingGoals && (
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Training Goals</dt>
                <dd className="text-ink">{status.trainingGoals}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Every other page an Apprentice can reach (see the "apprentice"
          entries in SIDEBAR, src/lib/nav.ts) as one tappable grid, so
          getting to Learning Programs/Quizzes/Skills/etc. doesn't
          depend on noticing the same links tucked into the sidebar —
          useful on mobile too, where the sidebar collapses into the
          "More" sheet. */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NavCard href="/training-programs" icon="◎" label="Learning Programs" description="Courses assigned to you" />
          <NavCard href="/training-sessions" icon="◎" label="Training Sessions" description="Classes & attendance" />
          <NavCard href="/training-plans" icon="▤" label="My Tasks" description="Assignments to submit" badge={openTasks.length > 0 ? String(openTasks.length) : undefined} />
          <NavCard href="/skills-matrix" icon="⚙" label="My Skills" description="Your competency levels" />
          <NavCard href="/quizzes" icon="✓" label="My Quizzes" description="Auto-scored assessments" />
          <NavCard href="/portfolios" icon="✂" label="My Portfolio" description="Your finished work" />
          <NavCard href="/notifications" icon="◍" label="Notifications" description="Updates on your training" />
          <NavCard href="/account" icon="☺" label="My Account" description="Profile, photo & password" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">My Tasks</h2>
            <a href="/training-plans" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          <DataTable
            columns={[
              { key: "task", label: "Task" },
              { key: "due", label: "Due" },
              { key: "status", label: "Status", isStatus: true },
            ]}
            rows={openTasks.map((t) => ({
              id: t.id,
              href: "/training-plans",
              cells: { task: t.title, due: t.due_date ?? "—", status: t.status },
            }))}
            emptyLabel="No open tasks right now — nice work!"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Portfolio</h2>
            <a href="/portfolios" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          {(portfolio ?? []).length === 0 ? (
            <div className="card p-6 text-center text-sm text-ink-muted">
              Nothing added yet — your finished pieces will show up here.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {(portfolio ?? []).map((p: any) => (
                <a
                  key={p.id}
                  href="/portfolios"
                  className="card overflow-hidden aspect-square block group"
                  style={{ boxShadow: "var(--shadow-xs)" }}
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sunken text-ink-faint text-2xl">✂</div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// One tappable tile per destination — icon + label with a one-line
// description underneath, and an optional small count badge (used for
// My Tasks' open-task count). `card-hover` (globals.css) already gives
// every `.card` in this app a lift + shadow on hover; this just adds
// the same treatment on `:active` so it reads as tappable on mobile
// too, not only hoverable with a mouse.
function NavCard({
  href,
  icon,
  label,
  description,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <a
      href={href}
      className="card card-hover p-4 flex flex-col gap-2 transition-transform active:scale-[0.97]"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-full bg-indigo-soft text-indigo flex items-center justify-center text-[15px] flex-shrink-0">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-burgundy text-white text-[10.5px] font-bold px-1.5 py-0.5 min-w-[18px] text-center leading-tight">
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-[11.5px] text-ink-muted mt-0.5">{description}</div>
      </div>
    </a>
  );
}
