import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function TrainingCompliancePage() {
  const { profile } = await requirePageRegistryFeature(["owner", "manager", "trainer"], "apprentices");
  const supabase = createClient();
  const orgId = profile.organization_id;

  const [
    { data: expiringCerts },
    { data: enrollments },
    { data: quizAttempts },
    { data: attendance },
  ] = await Promise.all([
    supabase
      .from("certificates")
      .select("id, certificate_number, expires_at, revoked_at, apprentice:apprentice_id(full_name), program:program_id(name)")
      .eq("organization_id", orgId)
      .not("expires_at", "is", null)
      .is("revoked_at", null)
      .order("expires_at", { ascending: true }),
    supabase.from("program_enrollments").select("id, status, program:program_id(name)").eq("organization_id", orgId),
    supabase.from("quiz_attempts").select("id, passed").eq("organization_id", orgId).not("submitted_at", "is", null),
    supabase.from("session_attendance").select("id, status").eq("organization_id", orgId),
  ]);

  const expiringSoon = (expiringCerts ?? []).filter((c: any) => {
    const d = daysUntil(c.expires_at);
    return d >= 0 && d <= 90;
  });
  const alreadyExpired = (expiringCerts ?? []).filter((c: any) => daysUntil(c.expires_at) < 0);

  const totalEnrollments = (enrollments ?? []).length;
  const completedEnrollments = (enrollments ?? []).filter((e: any) => e.status === "completed").length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : null;

  const submittedQuizzes = (quizAttempts ?? []).length;
  const passedQuizzes = (quizAttempts ?? []).filter((a: any) => a.passed).length;
  const quizPassRate = submittedQuizzes > 0 ? Math.round((passedQuizzes / submittedQuizzes) * 100) : null;

  const totalAttendanceRows = (attendance ?? []).length;
  const presentRows = (attendance ?? []).filter((a: any) => a.status === "present" || a.status === "late").length;
  const attendanceRate = totalAttendanceRows > 0 ? Math.round((presentRows / totalAttendanceRows) * 100) : null;

  const programCompletion = new Map<string, { total: number; completed: number }>();
  for (const e of (enrollments ?? []) as any[]) {
    const name = e.program?.name ?? "Unknown program";
    if (!programCompletion.has(name)) programCompletion.set(name, { total: 0, completed: 0 });
    const row = programCompletion.get(name)!;
    row.total += 1;
    if (e.status === "completed") row.completed += 1;
  }

  return (
    <div>
      <PageHead title="Training Compliance" subtitle="Certificate expiry, completion rates, quiz pass rates and attendance in one view." crumb="Learning" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Completion rate" value={completionRate !== null ? `${completionRate}%` : "—"} accent icon="✓" />
        <StatCard label="Quiz pass rate" value={quizPassRate !== null ? `${quizPassRate}%` : "—"} icon="✎" />
        <StatCard label="Attendance rate" value={attendanceRate !== null ? `${attendanceRate}%` : "—"} icon="◔" />
        <StatCard label="Certs expiring ≤90d" value={expiringSoon.length} icon="◷" />
      </div>

      <h3 className="section-label mb-2">Certificate expiry</h3>
      {alreadyExpired.length === 0 && expiringSoon.length === 0 ? (
        <EmptyState icon="✓" title="Nothing expiring." description="No active certificate has an expiry date within the next 90 days." />
      ) : (
        <div className="space-y-2 mb-8">
          {alreadyExpired.map((c: any) => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-ink text-sm">{c.apprentice?.full_name}</div>
                <div className="text-xs text-ink-muted">{c.program?.name} · #{c.certificate_number}</div>
              </div>
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">Expired</span>
            </div>
          ))}
          {expiringSoon.map((c: any) => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold text-ink text-sm">{c.apprentice?.full_name}</div>
                <div className="text-xs text-ink-muted">{c.program?.name} · #{c.certificate_number}</div>
              </div>
              <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                {daysUntil(c.expires_at)} day{daysUntil(c.expires_at) === 1 ? "" : "s"} left
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="section-label mb-2">Completion by program</h3>
      {programCompletion.size === 0 ? (
        <p className="text-sm text-ink-muted">No enrolments yet.</p>
      ) : (
        <div className="space-y-2">
          {Array.from(programCompletion.entries()).map(([name, row]) => {
            const pct = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
            return (
              <div key={name} className="card p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-ink">{name}</span>
                  <span className="text-ink-muted">{row.completed}/{row.total} completed</span>
                </div>
                <div className="h-2 rounded-full bg-sunken overflow-hidden">
                  <div className="h-full bg-indigo rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/training-sessions" className="text-indigo font-semibold hover:underline">View sessions →</Link>
        <Link href="/quizzes" className="text-indigo font-semibold hover:underline">View quizzes →</Link>
        <Link href="/skills-matrix" className="text-indigo font-semibold hover:underline">View skills matrix →</Link>
      </div>
    </div>
  );
}
