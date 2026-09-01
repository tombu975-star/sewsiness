import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, is_read, created_at")
    .eq("organization_id", profile?.organization_id ?? "")
    .or(`user_id.eq.${user!.id},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (notifications ?? []) as any[];

  return (
    <div>
      <PageHead title="Notification Center" subtitle="System and workflow notifications across the organization." crumb="Notifications" />
      {rows.length === 0 ? (
        <EmptyState icon="◔" title="You're all caught up." description="Notifications about orders, payments and tasks will show up here." />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.is_read ? "bg-info-soft/30" : ""}`}>
              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? "bg-burgundy" : "bg-transparent"}`} />
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">{n.title}</div>
                {n.body && <div className="text-sm text-ink-muted mt-0.5">{n.body}</div>}
                <div className="text-xs text-ink-faint mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
