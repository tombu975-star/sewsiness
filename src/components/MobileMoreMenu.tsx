"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MoreMenuSection } from "@/lib/nav";

// Mobile-only replacement for the old sidebar-in-a-drawer pattern. Instead
// of cloning the desktop rail into an overlay, this is its own mobile-native
// surface: a bottom sheet with search, grouped rows sized for a thumb, and
// account actions folded in — the same job a hamburger drawer did, but
// built the way a phone app actually does "everything else" (see Notion,
// Linear, Airbnb's More tab) rather than a repositioned desktop nav.
//
// Renders MORE_MENU's plain-language categories (Work, Money, Team, ...)
// rather than the desktop sidebar's own SIDEBAR tree — see nav.ts's
// comment on MORE_MENU for why those two are genuinely different
// groupings, not the same list styled twice. Every row carries a
// one-line description under its label (e.g. "Measurements — Saved
// customer measurement profiles") so someone who's never used this
// specific app before can tell what a destination does before tapping
// it, not just what it's called.
export function MobileMoreMenu({
  open,
  onClose,
  sections,
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
  sections: MoreMenuSection[];
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
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

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
          maxHeight: "min(88vh, 680px)",
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
            <div className="space-y-1">
              {filtered.map((section) => (
                <div key={section.title} className="pt-3 pb-1 first:pt-1">
                  <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors active:scale-[0.99] ${
                            active ? "bg-indigo-soft" : "hover:bg-sunken"
                          }`}
                        >
                          <span
                            className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-[16px] ${
                              active ? "bg-indigo2 text-white" : "bg-sunken text-indigo2"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`flex items-center gap-1.5 text-[14px] font-semibold ${active ? "text-indigo2" : "text-ink"}`}>
                              <span className="truncate">{item.label}</span>
                              {item.isNew && <NewTag />}
                            </span>
                            <span className="block text-[12px] text-ink-muted truncate">{item.description}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
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

