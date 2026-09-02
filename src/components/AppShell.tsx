"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logSignOut } from "@/app/(app)/audit/actions";
import { Spinner } from "@/components/Spinner";
import { InactivityGuard } from "@/components/InactivityGuard";
import { ROLES, sidebarForRole, bottomNavForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";

const SIDEBAR_COLLAPSED_KEY = "sewsiness_sidebar_collapsed";
const EXPANDED_W = 240;
const COLLAPSED_W = 76;

export function AppShell({
  role,
  fullName,
  orgName,
  branchName,
  avatarUrl,
  children,
}: {
  role: Role;
  fullName: string;
  orgName: string;
  branchName?: string | null;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // Starts expanded on first paint (matches server render, avoids a
  // hydration mismatch) and only switches to the person's saved
  // preference once mounted client-side.
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  // Lock body scroll while the mobile drawer is open, and let Escape
  // close it — small touches, but this is the kind of thing that makes
  // a drawer feel like part of the OS instead of a bolted-on overlay.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = sidebarForRole(role);
  const bottomItems = bottomNavForRole(role);
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isCollapsed = mounted && collapsed;

  async function handleSignOut() {
    setSigningOut(true);
    await logSignOut("manual");
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full browser navigation, not router.push — this guarantees the
    // client's Router Cache is discarded and every subsequent request hits
    // the server fresh, so no stale authenticated page can flash back in
    // without a manual reload.
    window.location.assign("/login");
  }

  const isItemActive = (href?: string, children?: { href: string }[]) => {
    if (href && pathname === href) return true;
    if (children) return children.some((c) => pathname === c.href);
    return false;
  };

  const NavList = ({ onNavigate, rail }: { onNavigate?: () => void; rail?: boolean }) => (
    <div className="p-nav flex-1 overflow-y-auto overflow-x-visible scrollbar-thin px-2 py-2 space-y-0.5">
      {items.map((item) => {
        const active = isItemActive(item.href, item.children);

        if (item.children) {
          return (
            <div key={item.label} className={`mb-1 relative ${rail ? "group" : ""}`}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors ${
                  rail ? "justify-center" : ""
                } ${active ? "text-white" : "text-sidebar-ink"} ${rail ? "group-hover:bg-white/[0.08] group-hover:text-white" : ""}`}
              >
                <span className="w-4 text-center text-[14px] flex-shrink-0">{item.icon}</span>
                {!rail && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.isNew && <NewTag />}
                  </>
                )}
              </div>

              {/* Expanded mode: children render inline, below the parent. */}
              {!rail &&
                item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onClick={onNavigate}
                    className={`flex items-center justify-between pl-9 pr-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all duration-150 ${
                      pathname === c.href
                        ? "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--gold),0_1px_3px_rgba(0,0,0,0.15)]"
                        : "text-sidebar-ink hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5"
                    }`}
                  >
                    <span>{c.label}</span>
                    {c.isNew && <NewTag />}
                  </Link>
                ))}

              {/* Collapsed rail mode: hidden by default, flies out to the
                  right on hover/focus — keeps the rail narrow while still
                  reaching every nested page without a second click. */}
              {rail && (
                <div
                  className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-150 absolute left-full top-0 ml-2 w-52 rounded-lg py-1.5 z-50"
                  style={{
                    background: "linear-gradient(180deg, var(--sidebar) 0%, #34104f 100%)",
                    boxShadow: "0 8px 24px -6px rgba(20,8,40,0.45), 0 0 0 1px var(--sidebar-border)",
                  }}
                >
                  <div className="px-3 pb-1.5 mb-1 border-b border-white/10 text-[11px] font-semibold uppercase tracking-wide text-sidebar-ink/80">
                    {item.label}
                  </div>
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={onNavigate}
                      className={`flex items-center justify-between mx-1.5 px-2.5 py-1.5 rounded-md text-[12.5px] font-medium ${
                        pathname === c.href ? "bg-sidebar-active text-white" : "text-sidebar-ink hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <span>{c.label}</span>
                      {c.isNew && <NewTag />}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={item.label + item.href} className={`relative ${rail ? "group" : ""}`}>
            <Link
              href={item.href!}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 ${
                rail ? "justify-center" : ""
              } ${
                active
                  ? "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--gold),0_1px_3px_rgba(0,0,0,0.15)]"
                  : "text-sidebar-ink hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5"
              }`}
            >
              <span className="w-4 text-center text-[14px] flex-shrink-0">{item.icon}</span>
              {!rail && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.isNew && <NewTag />}
                </>
              )}
            </Link>
            {rail && (
              <div
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap px-2.5 py-1.5 rounded-md text-[12.5px] font-semibold text-white z-50"
                style={{ background: "#2a0d40", boxShadow: "0 6px 18px -4px rgba(20,8,40,0.5)" }}
              >
                {item.label}
                {item.isNew && <NewTag />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <InactivityGuard />
      {/* Desktop sidebar — width animates between rail and full on toggle */}
      <aside
        className="hidden md:flex md:flex-col flex-shrink-0 text-white relative z-10 transition-[width] duration-300 ease-in-out overflow-visible"
        style={{
          width: isCollapsed ? COLLAPSED_W : EXPANDED_W,
          background: "linear-gradient(180deg, var(--sidebar) 0%, #34104f 100%)",
          boxShadow: "1px 0 0 var(--sidebar-border), 4px 0 24px -8px rgba(20, 8, 40, 0.35)",
        }}
      >
        <Brand orgName={orgName} collapsed={isCollapsed} />
        <NavList rail={isCollapsed} />
        <button
          onClick={toggleCollapsed}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-3 mx-2 mb-2 rounded-lg text-[12px] font-semibold text-sidebar-ink hover:bg-white/[0.06] hover:text-white transition-colors border-t border-sidebar-border/60"
          style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <span className="text-[13px]">{isCollapsed ? "»" : "«"}</span>
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </aside>

      {/* Mobile drawer — slides in/out with a transform, not a mount/unmount,
          so it animates smoothly both ways instead of just popping in. */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={() => setMobileNavOpen(false)} />
        <aside
          className={`absolute inset-y-0 left-0 w-[270px] max-w-[80vw] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: "linear-gradient(180deg, var(--sidebar) 0%, #34104f 100%)" }}
        >
          <Brand orgName={orgName} onClose={() => setMobileNavOpen(false)} />
          <NavList onNavigate={() => setMobileNavOpen(false)} />
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — sticky with a soft glass blur so content scrolling
            beneath it reads as "under glass" rather than abruptly cut off */}
        <header
          className="h-16 flex-shrink-0 sticky top-0 border-b border-border flex items-center justify-between px-4 md:px-6 gap-3 relative z-20"
          style={{
            background: "color-mix(in srgb, var(--surface) 88%, transparent)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 1px 0 var(--border), 0 4px 12px -8px rgba(30, 15, 66, 0.08)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-ink flex-shrink-0 hover:bg-sunken active:scale-95 transition-all"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div className="hidden md:block text-sm text-ink-muted truncate">
              <span className="font-semibold text-ink">{orgName}</span>
              {branchName && (
                <>
                  <span className="mx-1.5 text-border-strong">/</span>
                  {branchName}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/notifications"
              className="relative w-9 h-9 rounded-lg border border-border flex items-center justify-center text-ink-soft hover:bg-sunken hover:border-border-strong active:scale-95 transition-all"
              aria-label="Notifications"
            >
              🔔
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-burgundy ring-2 ring-surface" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-gold text-[#3a2400] flex items-center justify-center text-[12px] font-bold overflow-hidden ring-2 ring-transparent hover:ring-gold-soft active:scale-95 transition-all"
                style={{ boxShadow: "var(--shadow-gold)" }}
                aria-label="Account menu"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials || "?"
                )}
              </button>
              {drawerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)} />
                  <div
                    className="absolute right-0 mt-2 w-52 card p-2 z-50"
                    style={{ boxShadow: "var(--shadow-lg)" }}
                  >
                    <div className="px-2 py-1.5 mb-1 border-b border-border">
                      <div className="text-sm font-semibold text-ink truncate">{fullName}</div>
                      <div className="text-xs text-ink-muted">{roleLabel}</div>
                    </div>
                    <Link href="/settings" className="block px-2 py-1.5 text-sm rounded-lg hover:bg-sunken text-ink transition-colors">
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-sm rounded-lg hover:bg-sunken text-danger disabled:opacity-60 disabled:cursor-wait transition-colors"
                    >
                      {signingOut && <Spinner />}
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="kente-strip" />

        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto p-4 md:p-7">{children}</div>
        </main>

        {/* Mobile bottom nav — includes a safe-area inset so it never sits
            under the home-indicator on notched phones */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 flex items-stretch z-30"
          style={{
            height: "calc(4rem + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: "linear-gradient(180deg, var(--sidebar) 0%, #34104f 100%)",
            boxShadow: "0 -4px 16px -4px rgba(20, 8, 40, 0.35)",
          }}
        >
          {bottomItems.map((b) => {
            const isActive = pathname === b.href;
            return (
              <Link
                key={b.href}
                href={b.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors ${
                  isActive ? "text-white" : "text-sidebar-ink"
                }`}
              >
                {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-full bg-gold transition-all" />}
                <span className={`text-lg transition-transform ${isActive ? "text-gold scale-110" : ""}`}>{b.icon}</span>
                {b.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold text-sidebar-ink hover:text-white active:scale-95 transition-all"
          >
            <span className="text-lg">☰</span>
            More
          </button>
        </nav>
      </div>
    </div>
  );
}

function Brand({ orgName, collapsed, onClose }: { orgName: string; collapsed?: boolean; onClose?: () => void }) {
  return (
    <div
      className={`h-16 flex-shrink-0 flex items-center gap-2.5 px-5 transition-all duration-300 ${collapsed ? "justify-center px-0" : "justify-between"}`}
      style={{ borderBottom: "1px solid var(--sidebar-border)", boxShadow: "0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <svg width="28" height="28" viewBox="-270 -10 520 500" className="flex-shrink-0">
          <path
            d="M-160 250 C-80 80, 95 55, 170 150 C215 208, 180 270, 90 292 C-20 320,-85 365,-52 420 C-25 465, 80 458, 160 385"
            fill="none"
            stroke="#C9A6E8"
            strokeWidth="78"
            strokeLinecap="round"
          />
          <path
            d="M-155 250 C-78 105, 80 82, 150 155 C195 202, 165 245, 92 265"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path d="M-25 205 L145 20" stroke="#FBBF24" strokeWidth="14" strokeLinecap="round" />
        </svg>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-[14px] font-bold tracking-wide leading-none truncate text-white">SEWSINESS</div>
            <div className="text-[8px] uppercase tracking-wider text-sidebar-ink mt-1 truncate">{orgName}</div>
          </div>
        )}
      </div>
      {onClose && !collapsed && (
        <button
          onClick={onClose}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-sidebar-ink hover:bg-white/[0.08] hover:text-white transition-colors"
          aria-label="Close navigation"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function NewTag() {
  return (
    <span className="text-[8px] bg-gold text-[#3a2400] font-bold px-1.5 py-0.5 rounded-md ml-1.5">NEW</span>
  );
}
