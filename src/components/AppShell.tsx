"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logSignOut } from "@/app/(app)/audit/actions";
import { Spinner } from "@/components/Spinner";
import { InactivityGuard } from "@/components/InactivityGuard";
import { ROLES, sidebarForRole, bottomNavForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";

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

  const items = sidebarForRole(role);
  const bottomItems = bottomNavForRole(role);
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="p-nav flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-0.5">
      {items.map((item) => {
        const active = isItemActive(item.href, item.children);
        if (item.children) {
          return (
            <div key={item.label} className="mb-1">
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-semibold ${
                  active ? "text-white" : "text-sidebar-ink"
                }`}
              >
                <span className="w-4 text-center text-[14px]">{item.icon}</span>
                <span>{item.label}</span>
                {item.isNew && <NewTag />}
              </div>
              {item.children.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between pl-9 pr-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
                    pathname === c.href
                      ? "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--gold)]"
                      : "text-sidebar-ink hover:bg-sidebar-active/60 hover:text-white"
                  }`}
                >
                  <span>{c.label}</span>
                  {c.isNew && <NewTag />}
                </Link>
              ))}
            </div>
          );
        }
        return (
          <Link
            key={item.label + item.href}
            href={item.href!}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
              active
                ? "bg-sidebar-active text-white shadow-[inset_3px_0_0_var(--gold)]"
                : "text-sidebar-ink hover:bg-sidebar-active/60 hover:text-white"
            }`}
          >
            <span className="w-4 text-center text-[14px]">{item.icon}</span>
            <span>{item.label}</span>
            {item.isNew && <NewTag />}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <InactivityGuard />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-[240px] flex-shrink-0 bg-sidebar text-white">
        <Brand orgName={orgName} />
        <NavList />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-sidebar text-white flex flex-col shadow-2xl">
            <Brand orgName={orgName} />
            <NavList onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-ink flex-shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div className="hidden md:block text-sm text-ink-muted truncate">
              {orgName}
              {branchName && (
                <>
                  <span className="mx-1.5 text-border-strong">/</span>
                  {branchName}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/notifications" className="relative w-9 h-9 rounded-lg border border-border flex items-center justify-center text-ink-soft hover:bg-sunken" aria-label="Notifications">
              🔔
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-burgundy" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-gold text-[#3a2400] flex items-center justify-center text-[12px] font-bold overflow-hidden ring-2 ring-transparent hover:ring-gold-soft transition-shadow"
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
                <div className="absolute right-0 mt-2 w-52 card p-2 shadow-lg z-50">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-semibold text-ink truncate">{fullName}</div>
                    <div className="text-xs text-ink-muted">{roleLabel}</div>
                  </div>
                  <Link href="/settings" className="block px-2 py-1.5 text-sm rounded-lg hover:bg-sunken text-ink">
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-sm rounded-lg hover:bg-sunken text-danger disabled:opacity-60 disabled:cursor-wait"
                  >
                    {signingOut && <Spinner />}
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="kente-strip" />

        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto p-4 md:p-7">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-sidebar flex items-stretch z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.15)]">
          {bottomItems.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold ${
                pathname === b.href ? "text-white" : "text-sidebar-ink"
              }`}
            >
              <span className={`text-lg ${pathname === b.href ? "text-gold" : ""}`}>{b.icon}</span>
              {b.label}
            </Link>
          ))}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold text-sidebar-ink"
          >
            <span className="text-lg">☰</span>
            More
          </button>
        </nav>
      </div>
    </div>
  );
}

function Brand({ orgName }: { orgName: string }) {
  return (
    <div className="h-16 flex-shrink-0 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
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
      <div className="min-w-0">
        <div className="font-display text-[14px] font-bold tracking-wide leading-none truncate text-white">SEWSINESS</div>
        <div className="text-[8px] uppercase tracking-wider text-sidebar-ink mt-1 truncate">{orgName}</div>
      </div>
    </div>
  );
}

function NewTag() {
  return (
    <span className="text-[8px] bg-gold text-[#3a2400] font-bold px-1.5 py-0.5 rounded-md ml-1.5">NEW</span>
  );
}
