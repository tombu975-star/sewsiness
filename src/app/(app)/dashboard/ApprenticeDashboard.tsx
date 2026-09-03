import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";

// An Apprentice sees none of the shop's money or its full customer/order
// list — their sidebar reaches exactly three things (My Training i.e.
// this page, My Tasks, My Portfolio; see SIDEBAR in nav.ts), so this
// dashboard is scoped to those three: who's training them, what's
// assigned, and what they've made.
export async function ApprenticeDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();

  const [{ data: apprenticeProfile }, { data: tasks }, { data: portfolio }] = await Promise.all([
    supabase
      .from("apprentice_profiles")
      .select("training_level, specialisation, training_goals, start_date, trainer:trainer_id(full_name)")
      .eq("profile_id", userId)
      .maybeSingle(),
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
  ]);

  const taskRows = (tasks ?? []) as any[];
  const doneCount = taskRows.filter((t) => t.status === "Done").length;
  const openTasks = taskRows.filter((t) => t.status !== "Done").slice(0, 6);
  const trainerName = (apprenticeProfile as any)?.trainer?.full_name ?? null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        crumb={`Apprentice · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle="Your training progress and assigned tasks."
        actions={
          <Button href="/portfolios" variant="outline">
            My Portfolio
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">My Trainer</div>
          <div className="font-display text-lg font-semibold text-ink">{trainerName ?? "Not yet assigned"}</div>
        </div>
        <StatCard label="Training Level" value={(apprenticeProfile as any)?.training_level ?? "—"} icon="◎" />
        <StatCard label="Tasks Done" value={`${doneCount} / ${taskRows.length}`} accent icon="✓" />
      </div>

      {((apprenticeProfile as any)?.specialisation || (apprenticeProfile as any)?.training_goals) && (
        <div className="card p-5 mb-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h3 className="font-display text-[15px] font-semibold text-ink mb-3">About your training</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {(apprenticeProfile as any)?.specialisation && (
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Specialisation</dt>
                <dd className="text-ink">{(apprenticeProfile as any).specialisation}</dd>
              </div>
            )}
            {(apprenticeProfile as any)?.training_goals && (
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Training Goals</dt>
                <dd className="text-ink">{(apprenticeProfile as any).training_goals}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

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
