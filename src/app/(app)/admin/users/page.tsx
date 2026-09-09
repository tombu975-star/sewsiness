import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { suspendUser, reactivateUser, deleteUser } from "../users-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { InviteStatusBadge } from "@/components/InviteStatusBadge";
import { ResendInviteButton } from "@/components/ResendInviteButton";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Partial<Record<Role, string>> = {
  super_admin: "Super Admin",
  owner: "Business Owner",
  manager: "Manager",
  staff: "Staff",
  apprentice: "Apprentice",
  freelancer: "Freelancer",
  trainer: "Trainer",
};

const ROLE_FILTERS: (Role | "all")[] = [
  "all",
  "owner",
  "manager",
  "staff",
  "apprentice",
  "freelancer",
  "trainer",
  "super_admin",
];

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string };
}) {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();
  const roleFilter = (searchParams.role as Role | undefined) ?? undefined;
  const q = searchParams.q?.trim() ?? "";

  // RLS ("super admin can read all profiles") is what makes this
  // cross-tenant select possible — the same query for anyone else would
  // return only their own organization's members.
  let query = supabase
    .from("profiles")
    .select("id, full_name, role, created_at, suspended_at, organization:organization_id(name)")
    .neq("role", "system_admin")
    .order("created_at", { ascending: false });
  if (roleFilter) query = query.eq("role", roleFilter);
  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data, error } = await query;
  const users = (data ?? []) as any[];

  // RLS ("super admin can read all invites", 037) is what makes this
  // cross-tenant select possible — same reasoning as the profiles query
  // above. Not every user has a row here: accounts created before the
  // invites feature existed (032) are grandfathered in with nothing to
  // show, same as on the Staff/Freelancers/Apprentices pages.
  const { data: invites } = await supabase.from("invites").select("id, user_id, status, expires_at");
  const inviteByUser = new Map((invites ?? []).map((i: any) => [i.user_id, i]));

  return (
    <div>
      <PageHead
        title="Users & Roles"
        subtitle="Every account across every business on the platform. Suspending an account keeps their records intact and blocks their sign-in."
        crumb="Platform Admin"
      />

      <form className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-4" method="get">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin -mx-0.5 px-0.5">
          {ROLE_FILTERS.map((r) => (
            <a
              key={r}
              href={`/admin/users?role=${r === "all" ? "" : r}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                (roleFilter || "all") === r
                  ? "bg-indigo text-white border-indigo"
                  : "bg-surface text-ink-muted border-border-strong hover:bg-sunken"
              }`}
            >
              {r === "all" ? "All roles" : ROLE_LABEL[r]}
            </a>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">⌕</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            aria-label="Search by name"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-strong text-sm bg-surface focus:border-gold"
          />
        </div>
        {/* Preserves the role filter when the search form submits — the
            pill links above already carry it in their href, but this
            covers the case where someone types a search term and hits
            Enter without re-clicking a pill. */}
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
      </form>

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load users ({error.message}). Make sure{" "}
          <code className="font-mono">supabase/migrations/003_super_admin_platform.sql</code> has been run.
        </div>
      )}

      {!error && users.length === 0 ? (
        <EmptyState icon="⌂" title="No users match this filter." description="Try a different role or search term." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Role</th>
                <th className="text-left px-4 py-2.5 font-medium">Business</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Invite</th>
                <th className="text-left px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const invite = inviteByUser.get(u.id);
                return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-ink">{u.full_name}</td>
                  <td className="px-4 py-3 text-ink-muted">{ROLE_LABEL[u.role as Role] ?? u.role}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.organization?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.suspended_at ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                      {u.suspended_at ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {invite ? (
                      <div>
                        <InviteStatusBadge status={invite.status} expiresAt={invite.expires_at} />
                        {invite.status !== "revoked" && (
                          <ResendInviteButton inviteId={invite.id} revalidatePath="/admin/users" status={invite.status} />
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role === "super_admin" || u.role === "system_admin" ? null : (
                      <div className="flex items-center justify-end gap-2">
                        {u.suspended_at ? (
                          <form action={reactivateUser}>
                            <input type="hidden" name="profile_id" value={u.id} />
                            <SubmitButton variant="outline" pendingLabel="Reactivating…" className="!px-3 !py-1.5 !text-xs">
                              Reactivate
                            </SubmitButton>
                          </form>
                        ) : (
                          <form action={suspendUser}>
                            <input type="hidden" name="profile_id" value={u.id} />
                            <SubmitButton variant="danger" pendingLabel="Suspending…" className="!px-3 !py-1.5 !text-xs">
                              Suspend
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteUser}>
                          <input type="hidden" name="profile_id" value={u.id} />
                          <SubmitButton variant="outline" pendingLabel="Deleting…" className="!px-3 !py-1.5 !text-xs border-danger/40 text-danger hover:bg-danger-soft">
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
