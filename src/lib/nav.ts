import type { Role } from "@/lib/types";

export const ROLES: { id: Role; label: string; dashboardHref: string }[] = [
  { id: "super_admin", label: "Super Admin", dashboardHref: "/admin" },
  { id: "system_admin", label: "System Admin", dashboardHref: "/system" },
  { id: "owner", label: "Owner / Madam", dashboardHref: "/dashboard" },
  { id: "manager", label: "Manager", dashboardHref: "/dashboard" },
  { id: "staff", label: "Staff", dashboardHref: "/dashboard" },
  { id: "apprentice", label: "Apprentice", dashboardHref: "/dashboard" },
  { id: "freelancer", label: "Freelancer", dashboardHref: "/dashboard" },
  { id: "trainer", label: "Trainer", dashboardHref: "/dashboard" },
];

export interface NavChild {
  label: string;
  href: string;
  isNew?: boolean;
}

export interface NavItem {
  label: string;
  icon: string;
  href?: string;
  roles: Role[];
  isNew?: boolean;
  children?: NavChild[];
}

// Mirrors the wireframe's SIDEBAR array. Every entry now routes to a real,
// Supabase-backed page — nothing points at a generic placeholder anymore.
//
// NOTE: `super_admin` is Sewsiness's own platform-level account — the person
// who enrolls businesses onto the platform — not a business's Owner. It is
// deliberately left out of every business-operational item below (orders,
// POS, sales, products, customers, payments, staff, reports, etc.) so it
// never sees a business's revenue, invoices or customer records. Its own
// nav is defined separately in SUPER_ADMIN_SIDEBAR.
export const SIDEBAR: NavItem[] = [
  { label: "Dashboard", icon: "\u25A6", href: "/dashboard", roles: ["owner", "manager", "staff", "trainer"] },
  { label: "POS", icon: "\u26C1", href: "/pos", roles: ["owner", "manager", "staff"] },
  { label: "Sales", icon: "\u25A4", href: "/sales", roles: ["owner", "manager"] },
  {
    label: "Products", icon: "\u26DD", roles: ["owner", "manager"],
    children: [
      { label: "All Products", href: "/products" },
      { label: "Categories", href: "/product-categories" },
      { label: "Brands", href: "/product-brands" },
      { label: "Variants", href: "/product-variants" },
      { label: "Inventory", href: "/inventory" },
    ],
  },
  {
    label: "Dressmaking", icon: "\u2702", roles: ["owner", "manager", "staff"],
    children: [
      { label: "Custom Orders", href: "/orders" },
      { label: "Production", href: "/production" },
      { label: "Fittings", href: "/fittings" },
      { label: "Alterations", href: "/alterations" },
      { label: "Designs", href: "/designs" },
      { label: "Collections", href: "/collections", isNew: true },
    ],
  },
  { label: "Costing", icon: "\u232C", href: "/costing", roles: ["owner", "manager"], isNew: true },
  { label: "Quality Control", icon: "\u2713", href: "/quality-control", roles: ["owner", "manager", "staff"], isNew: true },
  {
    label: "Customers", icon: "\u2609", roles: ["owner", "manager", "staff"],
    children: [
      { label: "Customers", href: "/customers" },
      { label: "Measurements", href: "/measurements" },
      { label: "Customer Materials", href: "/customer-materials" },
    ],
  },
  {
    label: "Fabrics", icon: "\u25A7", roles: ["owner", "manager"],
    children: [
      { label: "Shop Fabrics", href: "/fabrics" },
      { label: "Fabric Inventory", href: "/fabric-inventory" },
    ],
  },
  {
    label: "Purchases", icon: "\u25A5", roles: ["owner", "manager"],
    children: [
      { label: "Suppliers", href: "/suppliers" },
      { label: "Purchase Orders", href: "/purchase-orders" },
      { label: "Goods Received", href: "/goods-received" },
    ],
  },
  { label: "Expenses", icon: "\u25C8", href: "/expenses", roles: ["owner", "manager"] },
  {
    label: "Payments", icon: "\u25C9", roles: ["owner", "manager"],
    children: [
      { label: "Customer Payments", href: "/payments" },
      { label: "Receivables", href: "/receivables" },
      { label: "Refunds", href: "/refunds" },
    ],
  },
  { label: "Staff", icon: "\u263A", href: "/staff", roles: ["owner", "manager"] },
  { label: "Workforce Hub", icon: "\u26D3", href: "/workforce", roles: ["owner", "manager"] },
  {
    label: "Freelancers", icon: "\u2692", roles: ["owner", "manager"],
    children: [
      { label: "Directory", href: "/freelancers" },
      { label: "Work Requests", href: "/freelancer-work-requests" },
      { label: "Payment Ledger", href: "/freelancer-payments" },
    ],
  },
  { label: "Freelancer Hub", icon: "\u2692", href: "/dashboard", roles: ["freelancer"] },
  { label: "Available Jobs", icon: "\u25A4", href: "/freelancer-work-requests", roles: ["freelancer"] },
  { label: "My Payments", icon: "\u25C9", href: "/freelancer-payments", roles: ["freelancer"] },
  {
    label: "Apprentices", icon: "\u2698", roles: ["owner", "manager", "trainer"],
    children: [
      { label: "Apprentices", href: "/apprentices" },
      { label: "Madam Hub", href: "/apprentice-madam-hub" },
      { label: "Training Plans", href: "/training-plans" },
      { label: "Portfolios", href: "/portfolios" },
    ],
  },
  { label: "Trainer Console", icon: "\u25CE", href: "/trainer-console", roles: ["trainer", "owner"], isNew: true },
  { label: "My Training", icon: "\u270E", href: "/dashboard", roles: ["apprentice"] },
  { label: "My Tasks", icon: "\u25A4", href: "/training-plans", roles: ["apprentice"] },
  { label: "My Portfolio", icon: "\u2698", href: "/portfolios", roles: ["apprentice"] },
  { label: "Branches", icon: "\u2302", href: "/branches", roles: ["owner", "manager"] },
  { label: "Reports", icon: "\u25A8", href: "/reports", roles: ["owner", "manager"] },
  {
    label: "Business Health", icon: "\u2661", roles: ["owner", "manager"], isNew: true,
    children: [
      { label: "Overview", href: "/business-health" },
      { label: "Full Assessment", href: "/business-health/assessment" },
    ],
  },
  {
    label: "Projections", icon: "\u27F6", roles: ["owner", "manager"], isNew: true,
    children: [
      { label: "Overview", href: "/projections" },
      { label: "Make-It-Happen Planner", href: "/projections-planner", isNew: true },
    ],
  },
  { label: "Notifications", icon: "\u25CD", href: "/notifications", roles: ["owner", "manager", "staff", "trainer", "apprentice", "freelancer"] },
  { label: "Audit Logs", icon: "\u25A3", href: "/audit", roles: ["owner"] },
  // Settings is deliberately narrower than most items here — it holds
  // account security plus organization/branch/platform configuration,
  // not day-to-day operational work, so only the roles that actually
  // manage a business (or the platform itself) see it in the sidebar.
  // Staff, Trainer, Apprentice and Freelancer never get an entry point
  // to it; settings/page.tsx enforces the same boundary server-side so
  // a direct link can't bypass this either.
  { label: "Settings", icon: "\u2699", href: "/settings", roles: ["owner", "manager"] },
];

export interface MoreMenuItem {
  label: string;
  description: string;
  icon: string;
  href: string;
  roles: Role[];
  isNew?: boolean;
}

export interface MoreMenuSection {
  title: string;
  items: MoreMenuItem[];
}

// Powers /more (see src/app/(app)/more/page.tsx) — the categorized,
// plain-language screen the mobile bottom nav's "More" tab opens,
// replacing what used to just be the full desktop sidebar dumped into a
// slide-out drawer. Deliberately its own list rather than derived from
// SIDEBAR above: SIDEBAR groups by feature area (its "Customers" parent
// holds Measurements, because that's the same database-ish grouping a
// developer would reach for), while this groups by what someone is
// actually trying to DO ("today's shop work" vs "money" vs "my team"),
// which cuts across SIDEBAR's own groupings. Forcing one shape to serve
// both would have compromised one of them, so this repeats the hrefs
// rather than transform SIDEBAR's tree.
//
// Every `roles` array below is copied from the matching SIDEBAR entry,
// so nothing here can show someone a destination SIDEBAR — and that
// page's own requirePageRole() — wouldn't already let them reach.
// Orders and Customers aren't repeated here: both are already primary
// bottom-nav tabs (see BOTTOM_NAV), and the whole point of this screen
// is to hold what didn't fit in those 4 slots, not to duplicate them.
export const MORE_MENU: MoreMenuSection[] = [
  {
    title: "Sell & Serve",
    items: [
      { label: "Point of Sale", description: "Ring up a walk-in sale", icon: "\u26C1", href: "/pos", roles: ["owner", "manager", "staff"] },
      { label: "Sales History", description: "Past sales and receipts", icon: "\u25A4", href: "/sales", roles: ["owner", "manager"] },
      { label: "Measurements", description: "Saved customer measurement profiles", icon: "\u25A6", href: "/measurements", roles: ["owner", "manager", "staff"] },
      { label: "Customer Materials", description: "Fabric customers dropped off", icon: "\u25A7", href: "/customer-materials", roles: ["owner", "manager", "staff"] },
    ],
  },
  {
    title: "Work",
    items: [
      { label: "Production", description: "Track what's being sewn right now", icon: "\u2702", href: "/production", roles: ["owner", "manager", "staff"] },
      { label: "Fittings", description: "Upcoming fitting appointments", icon: "\u25A6", href: "/fittings", roles: ["owner", "manager", "staff"] },
      { label: "Alterations", description: "Alteration jobs in progress", icon: "\u2702", href: "/alterations", roles: ["owner", "manager", "staff"] },
      { label: "Designs", description: "Your design catalog", icon: "\u270E", href: "/designs", roles: ["owner", "manager", "staff"] },
      { label: "Collections", description: "Group orders into seasonal sets", icon: "\u25A4", href: "/collections", roles: ["owner", "manager", "staff"], isNew: true },
      { label: "Quality Control", description: "Check finished work before delivery", icon: "\u2713", href: "/quality-control", roles: ["owner", "manager", "staff"], isNew: true },
      { label: "Costing", description: "Work out what a job should cost", icon: "\u232C", href: "/costing", roles: ["owner", "manager"], isNew: true },
    ],
  },
  {
    title: "Stock & Fabrics",
    items: [
      { label: "Products", description: "Items you sell", icon: "\u26DD", href: "/products", roles: ["owner", "manager"] },
      { label: "Inventory", description: "Stock levels across your shop", icon: "\u25A5", href: "/inventory", roles: ["owner", "manager"] },
      { label: "Fabrics", description: "Fabrics available in-shop", icon: "\u25A7", href: "/fabrics", roles: ["owner", "manager"] },
      { label: "Fabric Inventory", description: "Fabric stock on hand", icon: "\u25A7", href: "/fabric-inventory", roles: ["owner", "manager"] },
      { label: "Suppliers", description: "Who you buy stock and fabric from", icon: "\u26D3", href: "/suppliers", roles: ["owner", "manager"] },
      { label: "Purchase Orders", description: "Stock you've ordered in", icon: "\u25A5", href: "/purchase-orders", roles: ["owner", "manager"] },
      { label: "Goods Received", description: "Confirm deliveries arrived", icon: "\u2713", href: "/goods-received", roles: ["owner", "manager"] },
    ],
  },
  {
    title: "Money",
    items: [
      { label: "Payments", description: "Payments customers have made", icon: "\u25C9", href: "/payments", roles: ["owner", "manager"] },
      { label: "Receivables", description: "Money still owed to you", icon: "\u25C9", href: "/receivables", roles: ["owner", "manager"] },
      { label: "Refunds", description: "Refunds you've issued", icon: "\u25C8", href: "/refunds", roles: ["owner", "manager"] },
      { label: "Expenses", description: "What your business has spent", icon: "\u25C8", href: "/expenses", roles: ["owner", "manager"] },
      { label: "Freelancer Payments", description: "Pay your freelancers", icon: "\u25C9", href: "/freelancer-payments", roles: ["owner", "manager"] },
      { label: "My Payments", description: "Jobs you've been paid for", icon: "\u25C9", href: "/freelancer-payments", roles: ["freelancer"] },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Staff", description: "Everyone on your team", icon: "\u263A", href: "/staff", roles: ["owner", "manager"] },
      { label: "Workforce Hub", description: "Staff, apprentices and freelancers together", icon: "\u26D3", href: "/workforce", roles: ["owner", "manager"] },
      { label: "Freelancers", description: "Freelancers you work with", icon: "\u2692", href: "/freelancers", roles: ["owner", "manager"] },
      { label: "Available Jobs", description: "Jobs open for you to take", icon: "\u25A4", href: "/freelancer-work-requests", roles: ["freelancer"] },
      { label: "Apprentices", description: "Apprentices you're training", icon: "\u2698", href: "/apprentices", roles: ["owner", "manager", "trainer"] },
      { label: "Madam Hub", description: "Oversight of apprentice training", icon: "\u2698", href: "/apprentice-madam-hub", roles: ["owner", "manager", "trainer"] },
      { label: "Training Plans", description: "Tasks assigned to apprentices", icon: "\u25A4", href: "/training-plans", roles: ["owner", "manager", "trainer"] },
      { label: "My Tasks", description: "Tasks assigned to you", icon: "\u25A4", href: "/training-plans", roles: ["apprentice"] },
      { label: "Portfolios", description: "Apprentice work on display", icon: "\u2698", href: "/portfolios", roles: ["owner", "manager", "trainer"] },
      { label: "My Portfolio", description: "Your finished work", icon: "\u2698", href: "/portfolios", roles: ["apprentice"] },
      { label: "Trainer Console", description: "Your assigned apprentices", icon: "\u25CE", href: "/trainer-console", roles: ["trainer", "owner"] },
      { label: "Branches", description: "Your shop locations", icon: "\u2302", href: "/branches", roles: ["owner", "manager"] },
    ],
  },
  {
    title: "Reports & Insights",
    items: [
      { label: "Reports", description: "Business performance over time", icon: "\u25A8", href: "/reports", roles: ["owner", "manager"] },
      { label: "Business Health", description: "How your business is really doing", icon: "\u2661", href: "/business-health", roles: ["owner", "manager"], isNew: true },
      { label: "Projections", description: "Where your business is headed", icon: "\u27F6", href: "/projections", roles: ["owner", "manager"], isNew: true },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Audit Logs", description: "A record of who did what", icon: "\u25A3", href: "/audit", roles: ["owner"] },
      { label: "Settings", description: "Account and business settings", icon: "\u2699", href: "/settings", roles: ["owner", "manager"] },
    ],
  },
];

export function moreMenuForRole(role: Role): MoreMenuSection[] {
  return MORE_MENU.map((section) => ({ ...section, items: section.items.filter((i) => i.roles.includes(role)) })).filter(
    (section) => section.items.length > 0
  );
}

// Super Admin's entire nav — platform business-operations oversight
// only, no business data. Subscriptions/Billing/Support don't have a
// real backing page/schema yet. Feature Flags, Integrations, and
// System Health/Incidents deliberately live under System Admin instead
// (see SYSTEM_ADMIN_SIDEBAR below) — that's a developer's job, not a
// platform business-ops job, so it gets its own account and its own
// wall rather than being bolted onto this one.
export const SUPER_ADMIN_SIDEBAR: NavItem[] = [
  { label: "Platform Admin", icon: "\u25C6", href: "/admin", roles: ["super_admin"] },
  { label: "Business Intelligence", icon: "\u2261", href: "/admin/intelligence", roles: ["super_admin"], isNew: true },
  { label: "Account Requests", icon: "\u2709", href: "/admin/account-requests", roles: ["super_admin"], isNew: true },
  { label: "Users & Roles", icon: "\u263A", href: "/admin/users", roles: ["super_admin"] },
  { label: "Roles & Permissions", icon: "\u25CE", href: "/admin/roles", roles: ["super_admin"] },
  { label: "Apprentices & Trainers", icon: "\u2698", href: "/admin/apprentices", roles: ["super_admin"] },
  { label: "Freelancer Network", icon: "\u2692", href: "/admin/freelancers", roles: ["super_admin"] },
  { label: "Audit & Security", icon: "\u25A3", href: "/audit", roles: ["super_admin"] },
  { label: "Notifications", icon: "\u25CD", href: "/notifications", roles: ["super_admin"] },
  { label: "Settings", icon: "\u2699", href: "/settings", roles: ["super_admin"] },
];

// System Admin's entire nav — the developer's own workspace. No
// business data, no user/role management (that's Super Admin's job) —
// just what's live, what's connected, and what's broken.
export const SYSTEM_ADMIN_SIDEBAR: NavItem[] = [
  { label: "System Overview", icon: "\u25C6", href: "/system", roles: ["system_admin"] },
  { label: "Feature Flags", icon: "\u2691", href: "/system/flags", roles: ["system_admin"] },
  { label: "Integrations", icon: "\u2699", href: "/system/integrations", roles: ["system_admin"] },
  { label: "Incidents", icon: "\u26A0", href: "/system/incidents", roles: ["system_admin"] },
  { label: "Notifications", icon: "\u25CD", href: "/notifications", roles: ["system_admin"] },
  { label: "Settings", icon: "\u2699", href: "/settings", roles: ["system_admin"] },
];

export interface BottomNavItem {
  label: string;
  icon: string;
  href: string;
}

export const BOTTOM_NAV: BottomNavItem[] = [
  { label: "Home", icon: "\u2302", href: "/dashboard" },
  { label: "Customers", icon: "\u2609", href: "/customers" },
  { label: "Orders", icon: "\u2702", href: "/orders" },
  { label: "Alerts", icon: "\u25CD", href: "/notifications" },
];

export const BOTTOM_NAV_APPRENTICE: BottomNavItem[] = [
  { label: "My Training", icon: "\u2302", href: "/dashboard" },
  { label: "Tasks", icon: "\u25A4", href: "/training-plans" },
  { label: "Portfolio", icon: "\u2698", href: "/portfolios" },
];

export const BOTTOM_NAV_FREELANCER: BottomNavItem[] = [
  { label: "Home", icon: "\u2302", href: "/dashboard" },
  { label: "Jobs", icon: "\u25A4", href: "/freelancer-work-requests" },
  { label: "Payments", icon: "\u25C9", href: "/freelancer-payments" },
];

// Trainer has no POS/Orders/Customers access at all (see roles on the
// relevant SIDEBAR entries above), so the generic BOTTOM_NAV — Orders,
// POS, Customers — would put three dead-end tabs in front of them on
// mobile, each one bouncing straight back via requirePageRole. This
// mirrors what a Trainer's own sidebar actually reaches instead.
export const BOTTOM_NAV_TRAINER: BottomNavItem[] = [
  { label: "Home", icon: "\u2302", href: "/dashboard" },
  { label: "Console", icon: "\u25CE", href: "/trainer-console" },
  { label: "Apprentices", icon: "\u2698", href: "/apprentices" },
  { label: "Portfolios", icon: "\u25A4", href: "/portfolios" },
];

export const BOTTOM_NAV_SUPER_ADMIN: BottomNavItem[] = [
  { label: "Admin", icon: "\u25C6", href: "/admin" },
  { label: "Alerts", icon: "\u25CD", href: "/notifications" },
  { label: "Settings", icon: "\u2699", href: "/settings" },
];

export const BOTTOM_NAV_SYSTEM_ADMIN: BottomNavItem[] = [
  { label: "System", icon: "\u25C6", href: "/system" },
  { label: "Flags", icon: "\u2691", href: "/system/flags" },
  { label: "Incidents", icon: "\u26A0", href: "/system/incidents" },
];

export function sidebarForRole(role: Role): NavItem[] {
  if (role === "super_admin") return SUPER_ADMIN_SIDEBAR;
  if (role === "system_admin") return SYSTEM_ADMIN_SIDEBAR;
  return SIDEBAR.filter((g) => g.roles.includes(role));
}

export function bottomNavForRole(role: Role): BottomNavItem[] {
  if (role === "apprentice") return BOTTOM_NAV_APPRENTICE;
  if (role === "freelancer") return BOTTOM_NAV_FREELANCER;
  if (role === "trainer") return BOTTOM_NAV_TRAINER;
  if (role === "super_admin") return BOTTOM_NAV_SUPER_ADMIN;
  if (role === "system_admin") return BOTTOM_NAV_SYSTEM_ADMIN;
  return BOTTOM_NAV;
}

// Where each role should land after login / when hitting a page it can't access.
export function homePathForRole(role: Role): string {
  return ROLES.find((r) => r.id === role)?.dashboardHref ?? "/dashboard";
}

// Path prefixes each platform account (Super Admin / System Admin) is
// walled into — kept in sync with SUPER_ADMIN_ALLOWED_PATHS /
// SYSTEM_ADMIN_ALLOWED_PATHS in middleware.ts.
const PLATFORM_ALLOWED_PATHS: Partial<Record<Role, string[]>> = {
  super_admin: ["/admin", "/notifications", "/settings"],
  system_admin: ["/system", "/notifications", "/settings"],
};

// Resolves where a just-logged-in user should land, honoring a
// "?next=" redirect target (e.g. from a bookmarked link) but never for
// Super Admin / System Admin outside their own walled-off paths — those
// two are platform accounts, not business accounts, so following an
// arbitrary "next" straight into a business page (even just for an
// instant before middleware bounces them back) would land them on the
// wrong dashboard first. Every other role can use "next" freely.
export function resolveLoginDestination(role: Role, next?: string | null): string {
  const home = homePathForRole(role);
  if (!next) return home;

  const allowed = PLATFORM_ALLOWED_PATHS[role];
  if (allowed && !allowed.some((p) => next.startsWith(p))) {
    return home;
  }
  return next;
}
