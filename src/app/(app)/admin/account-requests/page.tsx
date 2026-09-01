import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/require-role";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { Tabs } from "@/components/Tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { markAccountRequestStatus, resolveAccountRecoveryRequest } from "../account-requests-actions";

type AccountRequest = {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string | null;
  status: "new" | "contacted" | "converted" | "dismissed";
  created_at: string;
};

type RecoveryRequest = {
  id: string;
  contact: string;
  matched_organization_id: string | null;
  organizations: { name: string } | null;
  created_at: string;
  resolved_at: string | null;
};

const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "In Progress",
  converted: "Completed",
  dismissed: "Cancelled",
};

function AccountRequestsTable({ rows }: { rows: AccountRequest[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="✉"
        title="No account requests yet."
        description="When someone submits the “Open an Account” form on the landing page, their details show up here."
      />
    );
  }
  return (
    <div className="card overflow-hidden overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-sunken/60">
            {["Name", "Business", "Contact", "Status", "Received", "Action"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-mono font-medium text-ink-muted text-[10.5px] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 border-b border-border font-medium text-ink whitespace-nowrap">{r.full_name}</td>
              <td className="px-4 py-3 border-b border-border text-ink whitespace-nowrap">{r.business_name}</td>
              <td className="px-4 py-3 border-b border-border text-ink-muted whitespace-nowrap">
                {r.email}
                {r.phone ? ` · ${r.phone}` : ""}
              </td>
              <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                <StatusBadge value={REQUEST_STATUS_LABEL[r.status] ?? r.status} />
              </td>
              <td className="px-4 py-3 border-b border-border text-ink-muted whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                {r.status === "new" || r.status === "contacted" ? (
                  <div className="flex gap-1.5">
                    {r.status === "new" && (
                      <form action={markAccountRequestStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="contacted" />
                        <button className="text-xs font-semibold text-indigo hover:underline">Mark contacted</button>
                      </form>
                    )}
                    <form action={markAccountRequestStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="converted" />
                      <button className="text-xs font-semibold text-success hover:underline">Converted</button>
                    </form>
                    <form action={markAccountRequestStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <button className="text-xs font-semibold text-ink-faint hover:underline">Dismiss</button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-ink-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecoveryRequestsTable({ rows }: { rows: RecoveryRequest[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="⚷"
        title="No account recovery requests."
        description="When someone submits the “forgotten account number” form, their contact and any matched business show up here."
      />
    );
  }
  return (
    <div className="card overflow-hidden overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-sunken/60">
            {["Contact", "Matched Business", "Received", "Status", "Action"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-mono font-medium text-ink-muted text-[10.5px] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 border-b border-border font-medium text-ink whitespace-nowrap">{r.contact}</td>
              <td className="px-4 py-3 border-b border-border text-ink-muted whitespace-nowrap">
                {r.organizations?.name ?? "No match found"}
              </td>
              <td className="px-4 py-3 border-b border-border text-ink-muted whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                <StatusBadge value={r.resolved_at ? "Completed" : "Pending"} />
              </td>
              <td className="px-4 py-3 border-b border-border whitespace-nowrap">
                {!r.resolved_at ? (
                  <form action={resolveAccountRecoveryRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs font-semibold text-indigo hover:underline">Mark resolved</button>
                  </form>
                ) : (
                  <span className="text-xs text-ink-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AccountRequestsPage() {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();

  const [{ data: requests, error: reqError }, { data: recoveries, error: recError }] = await Promise.all([
    supabase.from("account_requests").select("*").order("created_at", { ascending: false }),
    supabase
      .from("account_recovery_requests")
      .select("id, contact, matched_organization_id, created_at, resolved_at, organizations(name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHead
        crumb="Platform Owner / Super Admin"
        title="Account Requests"
        subtitle="Leads from “Open an Account” and lookups from “Forgotten account number”, both from the public landing page."
      />

      {(reqError || recError) && (
        <div className="callout mb-4">
          Couldn&rsquo;t load account requests ({reqError?.message || recError?.message}). If this is a fresh
          database, make sure you&rsquo;ve run{" "}
          <code className="font-mono">supabase/migrations/018_platform_business_intelligence.sql</code> in
          the Supabase SQL editor.
        </div>
      )}

      <Tabs
        tabs={[
          { label: "Open Account Requests", content: <AccountRequestsTable rows={(requests ?? []) as AccountRequest[]} /> },
          { label: "Account Recovery", content: <RecoveryRequestsTable rows={(recoveries ?? []) as unknown as RecoveryRequest[]} /> },
        ]}
      />
    </div>
  );
}
