"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";

export interface DataTableColumn {
  key: string;
  label: string;
  isStatus?: boolean;
  // Mobile card view only: hides this column from the card body. Use for
  // columns that are redundant once the primary/status fields are shown
  // (e.g. a raw internal id sitting next to a friendlier order number).
  hideOnMobile?: boolean;
}

export interface DataTableRow {
  id: string;
  href?: string;
  cells: Record<string, React.ReactNode>;
  // Renders a circular avatar ahead of the primary column — the "list of
  // people" pattern (Clients, Tailors, Trainers, Staff): a photo if
  // avatarUrl resolves, otherwise a colored circle of avatarLabel's
  // initials. Omit both on rows that aren't "a person" (orders, fabric,
  // products) and the avatar column simply isn't rendered.
  avatarLabel?: string;
  avatarUrl?: string | null;
}

function initialsOf(label: string) {
  return label
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ label, url }: { label: string; url?: string | null }) {
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-soft text-indigo flex items-center justify-center text-[12px] font-bold overflow-hidden flex-shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        initialsOf(label) || "?"
      )}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  emptyLabel = "No records yet.",
  // Which column heads the mobile card as its title. Defaults to the
  // first column, which is the right choice almost everywhere this
  // component is used (order number, customer name, product name, ...).
  mobilePrimaryKey,
  // Renders a search box above the list/table that filters rows
  // client-side (no round-trip) by matching the query, case-insensitively,
  // against every plain-string cell value in the row — which covers
  // names, phone numbers, order numbers, etc. for free, and simply skips
  // cells that hold JSX (buttons, badges) rather than text. Pass a
  // placeholder string to enable it, or `true` for a generic one.
  searchable,
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyLabel?: string;
  mobilePrimaryKey?: string;
  searchable?: boolean | string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const visibleRows = useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.avatarLabel?.toLowerCase().includes(q)) return true;
      return Object.values(row.cells).some((v) => typeof v === "string" && v.toLowerCase().includes(q));
    });
  }, [rows, query, searchable]);

  // A row can be clickable (href) AND contain its own interactive cell
  // content (a Resend/Mark Complete button, a status <select>, etc — see
  // apprentices/page.tsx). Without this guard, clicking that nested
  // control would bubble up to the row's own onClick and navigate away
  // mid-click. Checking the actual click target's ancestry, rather than
  // just not setting href on such rows, means callers don't have to
  // choose between "this row links somewhere" and "this row has a
  // working button in it" — both already need to coexist today.
  function handleRowClick(e: React.MouseEvent, href?: string) {
    if (!href) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    router.push(href);
  }

  function handleRowKeyDown(e: React.KeyboardEvent, href?: string) {
    if (!href || (e.key !== "Enter" && e.key !== " ")) return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    e.preventDefault();
    router.push(href);
  }

  const statusCol = columns.find((c) => c.isStatus);
  const primaryKey = mobilePrimaryKey ?? columns[0]?.key;
  const primaryCol = columns.find((c) => c.key === primaryKey);
  const detailCols = columns.filter((c) => c.key !== primaryKey && c.key !== statusCol?.key && !c.hideOnMobile);
  const hasAvatars = rows.some((r) => r.avatarLabel);

  const searchBox = searchable && (
    <div className="relative mb-3">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-[13px]" aria-hidden="true">
        ⚲
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={typeof searchable === "string" ? searchable : "Search…"}
        className="field-input w-full !pl-9"
        aria-label="Search"
      />
    </div>
  );

  if (rows.length === 0) {
    return <div className="card p-10 text-center text-ink-muted text-sm">{emptyLabel}</div>;
  }

  return (
    <>
      {searchBox}
      {visibleRows.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted text-sm">No matches for &ldquo;{query}&rdquo;.</div>
      ) : (
        <>
          {/* Mobile: a tappable card per row, with the row's own status badge
              (if any) up top and every other field laid out as a plain
              label/value list — no sideways scrolling, no squinting at a
              ten-column table shrunk onto a phone screen. This is the same
              `columns`/`rows` data every page already passes in; nothing
              about existing call sites needs to change for this to apply. */}
          <div className="md:hidden space-y-2.5">
            {visibleRows.map((row) => (
              <div
                key={row.id}
                onClick={(e) => handleRowClick(e, row.href)}
                onKeyDown={(e) => handleRowKeyDown(e, row.href)}
                tabIndex={row.href ? 0 : undefined}
                role={row.href ? "link" : undefined}
                aria-label={row.href ? `Open ${String(row.cells[primaryKey ?? ""] ?? "record")}` : undefined}
                className={`card p-4 ${row.href ? "active:bg-sunken active:scale-[0.99] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo2 focus-visible:outline-none" : ""}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {row.avatarLabel && <Avatar label={row.avatarLabel} url={row.avatarUrl} />}
                    <div className="font-display font-semibold text-[15px] text-ink leading-snug min-w-0 break-words">
                      {primaryCol ? row.cells[primaryCol.key] : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusCol &&
                      (typeof row.cells[statusCol.key] === "string" ? (
                        <StatusBadge value={row.cells[statusCol.key] as string} />
                      ) : (
                        row.cells[statusCol.key]
                      ))}
                    {row.href && <span className="text-ink-faint text-[13px]">›</span>}
                  </div>
                </div>
                {detailCols.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2.5 border-t border-border">
                    {detailCols.map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-0.5">{c.label}</dt>
                        <dd className="text-[12.5px] text-ink-soft truncate">{row.cells[c.key]}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>

          {/* Desktop / tablet: the classic dense table. */}
          <div className="hidden md:block card overflow-hidden overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr
                  className="border-b border-border"
                  style={{ background: "linear-gradient(180deg, var(--sunken), var(--surface))" }}
                >
                  {hasAvatars && <th className="w-12 px-4 py-3" />}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="text-left px-4 py-3 font-mono font-semibold text-ink-soft text-[10.5px] uppercase tracking-wider whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => handleRowClick(e, row.href)}
                    onKeyDown={(e) => handleRowKeyDown(e, row.href)}
                    tabIndex={row.href ? 0 : undefined}
                    aria-label={row.href ? `Open ${String(row.cells[primaryKey ?? ""] ?? "record")}` : undefined}
                    className={row.href ? "group hover:bg-sunken/50 focus-visible:bg-sunken/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo2 cursor-pointer transition-colors" : ""}
                  >
                    {hasAvatars && (
                      <td className="pl-4 py-3.5 border-b border-border last:border-b-0 align-middle group-hover:border-border-strong transition-colors">
                        {row.avatarLabel && <Avatar label={row.avatarLabel} url={row.avatarUrl} />}
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className="px-4 py-3.5 border-b border-border last:border-b-0 align-top whitespace-nowrap group-hover:border-border-strong transition-colors"
                      >
                        {c.isStatus && typeof row.cells[c.key] === "string" ? (
                          <StatusBadge value={row.cells[c.key] as string} />
                        ) : (
                          row.cells[c.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
