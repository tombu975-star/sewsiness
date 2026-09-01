import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";

export default async function ProjectionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: payments } = await supabase.from("payments").select("amount, created_at").eq("organization_id", orgId).gte("created_at", since.toISOString());
  const last30 = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const dailyAvg = last30 / 30;
  const projectedMonth = dailyAvg * 30;
  const projectedQuarter = dailyAvg * 90;
  const projectedYear = dailyAvg * 365;

  return (
    <div>
      <PageHead title="Business Projections" subtitle="Revenue projections based on your last 30 days of collections." crumb="Projections" actions={<Button href="/projections-planner" variant="outline">Make-It-Happen Planner →</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Daily Average" value={`₵${dailyAvg.toFixed(2)}`} />
        <StatCard label="Projected / Month" value={`₵${projectedMonth.toFixed(2)}`} accent />
        <StatCard label="Projected / Quarter" value={`₵${projectedQuarter.toFixed(2)}`} />
        <StatCard label="Projected / Year" value={`₵${projectedYear.toFixed(2)}`} />
      </div>
      <p className="text-xs text-ink-faint mt-4">Based on ₵{last30.toFixed(2)} collected over the last 30 days. Projections are a simple linear extrapolation — treat them as a directional estimate, not a forecast.</p>
    </div>
  );
}
