import Link from "next/link";
import { StatCard } from "@/components/StatCard";

export function SystemOverviewCard({
  flagsOn,
  flagsTotal,
  integrationsTotal,
  openIncidents,
}: {
  flagsOn: number;
  flagsTotal: number;
  integrationsTotal: number;
  openIncidents: number;
}) {
  return (
    <div className="space-y-5">
      <div className="card p-4 bg-indigo-soft/40 border-indigo-soft text-[13px] text-ink-soft">
        System Admin is Sewsiness&rsquo;s own technical account — it manages what&rsquo;s live,
        what&rsquo;s connected, and what&rsquo;s broken. It never touches business or platform-
        branding settings; those stay with Super Admin.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Feature Flags On" value={`${flagsOn} / ${flagsTotal}`} />
        <StatCard label="Integrations" value={integrationsTotal} />
        <StatCard label="Open Incidents" value={openIncidents} accent={openIncidents > 0} />
      </div>

      <div className="card divide-y divide-border">
        <QuickLink href="/system/flags" title="Feature Flags" description="Turn parts of the product on or off without a redeploy." />
        <QuickLink href="/system/integrations" title="Integrations" description="Third-party API health and credentials." />
        <QuickLink href="/system/incidents" title="Incidents" description="Log and track issues before businesses see them." />
      </div>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sunken transition-colors">
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-xs text-ink-muted mt-0.5">{description}</div>
      </div>
      <span className="text-ink-faint">→</span>
    </Link>
  );
}
