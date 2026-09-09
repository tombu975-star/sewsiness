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
}

export function DataTable({
  columns,
  rows,
  emptyLabel = "No records yet.",
  // Which column heads the mobile card as its title. Defaults to the
  // first column, which is the right choice almost everywhere this
  // component is used (order number, customer name, product name, ...).
  mobilePrimaryKey,
  // Cell keys to match against the search box, e.g. ["name", "phone"].
  // Every page already fetches its full row set server-side with no
  // pagination, so this filters what's already on the page rather than
  // re-querying — instant, no server round trip, and every caller gets
  // it by adding one prop instead of hand-rolling its own input+state.
  // Only string/number cell values are matched; React-node cells (badges,
  // buttons) are skipped since there's no reliable text to search on.
  searchKeys,
  searchPlaceholder = "Search…",
  // A single filter dimension rendered as tabs above the table — "All"
  // plus one tab per option — matching a cell's exact string value.
  // Pass the same field a column already renders (often the status
  // column) so the tabs and the table agree with each other.
  filterKey,
  filterOptions,
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyLabel?: string;
  mobilePrimaryKey?: string;
  searchKeys?: string[];
  searchPlaceholder?: string;
  filterKey?: string;
  filterOptions?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const visibleRows = useMemo(() => {
    let result = rows;
    if (filterKey && activeFilter !== "All") {
      result = result.filter((r) => r.cells[filterKey] === activeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q && searchKeys?.length) {
      result = result.filter((r) =>
        searchKeys.some((key) => {
          const value = r.cells[key];
          return typeof value === "string" || typeof value === "number"
            ? String(value).toLowerCase().includes(q)
            : false;
        })
      );
    }
    return result;
  }, [rows, query, activeFilter, filterKey, searchKeys]);

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

  if (rows.length === 0) {
    return <div className="card p-10 text-center text-ink-muted text-sm">{emptyLabel}</div>;
  }

  const statusCol = columns.find((c) => c.isStatus);
  const primaryKey = mobilePrimaryKey ?? columns[0]?.key;
  const primaryCol = columns.find((c) => c.key === primaryKey);
  const detailCols = columns.filter((c) => c.key !== primaryKey && c.key !== statusCol?.key && !c.hideOnMobile);
  const showToolbar = Boolean((searchKeys && searchKeys.length > 0) || (filterKey && filterOptions?.length));

  return (
    <>
      {showToolbar && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-3">
          {filterKey && filterOptions && filterOptions.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin -mx-0.5 px-0.5">
              {["All", ...filterOptions].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setActiveFilter(opt)}
                  aria-pressed={activeFilter === opt}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo2 ${
                    activeFilter === opt ? "bg-indigo text-white" : "bg-sunken text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {searchKeys && searchKeys.length > 0 && (
            <div className="relative sm:ml-auto sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm pointer-events-none">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-strong bg-surface text-sm focus:border-gold"
              />
            </div>
          )}
        </div>
      )}

      {visibleRows.length === 0 ? (
        <div className="card p-10 text-center text-ink-muted text-sm">
          No records match {query ? `"${query}"` : "this filter"}.
        </div>
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
              <div className="font-display font-semibold text-[15px] text-ink leading-snug min-w-0 break-words">
                {primaryCol ? row.cells[primaryCol.key] : null}
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
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
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
