import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { PermissionToggle } from "./PermissionToggle";
import type { Role } from "@/lib/types";
import { requirePageRole } from "@/lib/auth/require-role";

const ROLES: Role[] = ["super_admin", "system_admin", "owner", "manager", "staff", "trainer", "apprentice", "freelancer"];
const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  system_admin: "System Admin",
  owner: "Business Owner",
  manager: "Manager",
  staff: "Staff",
  apprentice: "Apprentice",
  freelancer: "Freelancer",
  trainer: "Trainer",
};
const ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT", "MANAGE", "ADMINISTER"];

export default async function RolesPermissionsPage({ searchParams }: { searchParams: { role?: string } }) {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();
  const activeRole = (searchParams.role as Role) && ROLES.includes(searchParams.role as Role) ? (searchParams.role as Role) : "super_admin";

  const { data, error } = await supabase
    .from("role_permissions")
    .select("id, role, module, action, scope, allowed")
    .eq("role", activeRole)
    .order("module");

  const rows = (data ?? []) as any[];

  // Group by module -> which actions exist for it, so the table only
  // shows columns that actually have a defined cell for this role.
  const modules = Array.from(new Set(rows.map((r) => r.module)));
  const cell = (module: string, action: string) => rows.find((r) => r.module === module && r.action === action);
  const actionsUsed = ACTIONS.filter((a) => rows.some((r) => r.action === a));

  return (
    <div>
      <PageHead
        title="Roles & Permissions"
        subtitle="A governance reference for what each role is intended to do — see the callout below."
        crumb="Platform Admin"
      />

      <div className="callout mb-5">
        This matrix is a real, editable record of intended permissions — but it is <strong>not yet the live
        enforcement mechanism</strong>. Actual access control today runs through Postgres Row-Level Security
        policies and route guards written directly against each role (see{" "}
        <code className="font-mono">supabase/schema.sql</code> and <code className="font-mono">src/lib/nav.ts</code>).
        Toggling a checkbox here records intent for future policy work; it does not change what anyone can do in
        the app yet.
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {ROLES.map((r) => (
          <a
            key={r}
            href={`/admin/roles?role=${r}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              activeRole === r ? "bg-gold text-[#3a2400] border-gold" : "bg-surface text-ink-muted border-border-strong hover:bg-sunken"
            }`}
          >
            {ROLE_LABEL[r]}
          </a>
        ))}
      </div>

      {error && <div className="callout mb-4">Couldn&rsquo;t load permissions ({error.message}).</div>}

      {!error && modules.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          No permission rows seeded for {ROLE_LABEL[activeRole]} yet.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-ink-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Module</th>
                <th className="text-left px-4 py-2.5 font-medium">Scope</th>
                {actionsUsed.map((a) => (
                  <th key={a} className="text-center px-3 py-2.5 font-medium">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => {
                const scope = rows.find((r) => r.module === m)?.scope ?? "";
                return (
                  <tr key={m} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-ink">{m}</td>
                    <td className="px-4 py-3 text-ink-muted text-xs">{scope}</td>
                    {actionsUsed.map((a) => {
                      const c = cell(m, a);
                      return (
                        <td key={a} className="text-center px-3 py-3">
                          {c ? (
                            <PermissionToggle role={activeRole} module={m} action={a} scope={c.scope} allowed={c.allowed} />
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      );
                    })}
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
