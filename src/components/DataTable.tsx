"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";

export interface DataTableColumn {
  key: string;
  label: string;
  isStatus?: boolean;
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
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyLabel?: string;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center text-ink-muted text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden overflow-x-auto scrollbar-thin">
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
  );
}
