"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/nav";

// Mobile-only replacement for the old sidebar-in-a-drawer pattern. Instead
// of cloning the desktop rail into an overlay, this is its own mobile-native
// surface: a bottom sheet with search, grouped rows sized for a thumb, and
// account actions folded in — the same job a hamburger drawer did, but
// built the way a phone app actually does "everything else" (see Notion,
// Linear, Airbnb's More tab) rather than a repositioned desktop nav.
export function MobileMoreMenu({
  open,
  onClose,
  items,
  pathname,
  fullName,
  roleLabel,
  avatarUrl,
  orgName,
  branchName,
  onSignOut,
  signingOut,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  pathname: string;
  fullName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  orgName: string;
  branchName?: string | null;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [query, setQuery] = useState("");

  // Clear the search whenever the sheet is reopened, so it never surprises
  // someone with a stale filter from last time.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items
      .map((item) => {
        if (item.label.toLowerCase().includes(q)) return item;
        if (item.children) {
          const kids = item.children.filter((c) => c.label.toLowerCase().includes(q));
          if (kids.length) return { ...item, children: kids };
          return null;
        }
        return null;
      })
      .filter((i): i is NavItem => i !== null);
  }, [items, query]);

  const isActive = (href?: string, children?: { href: string }[]) => {
    if (href && pathname === href) return true;
    if (children) return children.some((c) => pathname === c.href);
    return false;
  };

  return (
    <>
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[22px] bg-surface transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxHeight: "min(86vh, 640px)",
          boxShadow: "0 -12px 32px -8px rgba(30, 15, 66, 0.28)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold text-ink leading-tight truncate">Menu</div>
            <div className="text-[12px] text-ink-muted truncate">
              {orgName}
              {branchName ? ` / ${branchName}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-ink-soft hover:bg-sunken active:scale-95 transition-all"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-[13px] pointer-events-none">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu"
              className="w-full h-10 rounded-lg border border-border bg-sunken pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-indigo2/30 focus:border-indigo2 transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2">
          {filtered.length === 0 ? (
            <div className="px-2 py-10 text-center text-[13px] text-ink-muted">
              Nothing matches &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((item) => {
                const active = isActive(item.href, item.children);

                if (item.children) {
                  return (
                    <div key={item.label} className="pt-2 pb-1">
                      <div className="flex items-center gap-2 px-2.5 pb-1 text-[11px] font-semibold text-ink-faint">
                        <span className="w-4 text-center text-[12px]">{item.icon}</span>
                        {item.label}
                      </div>
                      <div className="space-y-0.5">
                        {item.children.map((c) => (
                          <Link
                            key={c.href}
                            href={c.href}
                            onClick={onClose}
                            className={`flex items-center justify-between gap-2 pl-9 pr-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors active:scale-[0.99] ${
                              pathname === c.href
                                ? "bg-indigo-soft text-indigo2"
                                : "text-ink hover:bg-sunken"
                            }`}
                          >
                            <span className="truncate">{c.label}</span>
                            {c.isNew && <NewTag />}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label + item.href}
                    href={item.href!}
                    onClick={onClose}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors active:scale-[0.99] ${
                      active ? "bg-indigo-soft text-indigo2" : "text-ink hover:bg-sunken"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-[14px] flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.isNew && <NewTag />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border px-3 py-2 space-y-0.5">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-ink hover:bg-sunken transition-colors"
          >
            <span
              className="w-9 h-9 rounded-full bg-gold text-[#3a2400] flex items-center justify-center text-[11px] font-bold overflow-hidden flex-shrink-0"
              style={{ boxShadow: "var(--shadow-gold)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials || "?"
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate">{fullName}</span>
              <span className="block text-[11.5px] text-ink-muted truncate">{roleLabel} · Account settings</span>
            </span>
          </Link>
          <button
            onClick={onSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13.5px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60 disabled:cursor-wait transition-colors"
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0">⏻</span>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </>
  );
}

function NewTag() {
  return (
    <span className="text-[8px] bg-gold text-[#3a2400] font-bold px-1.5 py-0.5 rounded-md ml-1.5 flex-shrink-0">
      NEW
    </span>
  );
}
