"use client";

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
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyLabel?: string;
  mobilePrimaryKey?: string;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return <div className="card p-10 text-center text-ink-muted text-sm">{emptyLabel}</div>;
  }

  const statusCol = columns.find((c) => c.isStatus);
  const primaryKey = mobilePrimaryKey ?? columns[0]?.key;
  const primaryCol = columns.find((c) => c.key === primaryKey);
  const detailCols = columns.filter((c) => c.key !== primaryKey && c.key !== statusCol?.key && !c.hideOnMobile);

  return (
    <>
      {/* Mobile: a tappable card per row, with the row's own status badge
          (if any) up top and every other field laid out as a plain
          label/value list — no sideways scrolling, no squinting at a
          ten-column table shrunk onto a phone screen. This is the same
          `columns`/`rows` data every page already passes in; nothing
          about existing call sites needs to change for this to apply. */}
      <div className="md:hidden space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => row.href && router.push(row.href)}
            className={`card p-4 ${row.href ? "active:bg-sunken active:scale-[0.99] transition-all cursor-pointer" : ""}`}
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
                  className="text-left px-4 py-3 font-mono font-semibold text-ink-soft text-[10.5px] uppercase tracking-wider whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => row.href && router.push(row.href)}
                className={row.href ? "group hover:bg-sunken/50 cursor-pointer transition-colors" : ""}
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
  );
}
