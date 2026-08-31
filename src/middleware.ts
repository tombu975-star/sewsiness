import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/open-account",
  "/forgot-account",
  "/accept-invite",
  "/auth",
  "/_next",
  "/favicon.ico",
  "/suspended",
  "/pending-verification",
];

// Super Admin is Sewsiness's own platform account (it enrolls businesses),
// not a business Owner — it must never reach business-operational pages,
// even by typing the URL directly. Keep this in sync with SUPER_ADMIN_SIDEBAR
// in src/lib/nav.ts.
const SUPER_ADMIN_ALLOWED_PATHS = ["/admin", "/notifications", "/settings"];
const SUPER_ADMIN_HOME = "/admin";

// System Admin is Sewsiness's developer/technical account — feature
// flags, third-party integration health, and incident tracking. It
// gets the same hard, server-side wall as Super Admin, but around a
// completely separate set of pages: it must never reach a business's
// operational pages OR Super Admin's business/user-management pages
// (Enrolled Businesses, Users & Roles). Keep in sync with
// SYSTEM_ADMIN_SIDEBAR in src/lib/nav.ts.
const SYSTEM_ADMIN_ALLOWED_PATHS = ["/system", "/notifications", "/settings"];
const SYSTEM_ADMIN_HOME = "/system";

const DEFAULT_HOME = "/dashboard";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "/" is the landing chooser (rotating cover + "Log in" / "Create a
  // business account") and must be reachable by a logged-out visitor —
  // checked as an exact match (not .startsWith, since every path starts
  // with "/") so it doesn't accidentally make the whole app public.
  const isPublic =
    request.nextUrl.pathname === "/" ||
    PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended_at, organization_id, organizations(verification_status)")
      .eq("id", user.id)
      .single();
    const role = profile?.role;
    const homePath =
      role === "super_admin" ? SUPER_ADMIN_HOME : role === "system_admin" ? SYSTEM_ADMIN_HOME : DEFAULT_HOME;

    // A suspended account is signed out immediately, wherever it tries to
    // go — no lingering session, no cached page keeps working.
    if (profile?.suspended_at && request.nextUrl.pathname !== "/suspended") {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      // Carry over the Set-Cookie headers signOut() wrote onto `response`
      // (via the cookies.set/remove callbacks above) — otherwise the
      // session cookie never actually clears in the browser.
      response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
      return redirectResponse;
    }

    // A self-signed-up business (see /signup) isn't usable until Super
    // Admin has reviewed its Ghana Card + selfie. Unlike suspension this
    // isn't punitive, so the session stays alive — they can just come
    // back once it's approved. Super Admin/System Admin have no
    // organization_id, so this never touches either of those accounts.
    const orgVerification = (profile as any)?.organizations?.verification_status as string | undefined;
    if (
      orgVerification &&
      orgVerification !== "verified" &&
      request.nextUrl.pathname !== "/pending-verification"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending-verification";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("next") || homePath;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Super Admin gets a hard, server-side wall around business pages —
    // not just a nav that hides the links — so it can only ever see
    // platform-level oversight, never a business's revenue, invoices or
    // customer records.
    if (
      role === "super_admin" &&
      !isPublic &&
      !SUPER_ADMIN_ALLOWED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = SUPER_ADMIN_HOME;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Same wall for System Admin, around its own (disjoint) set of
    // pages — a developer account has no business reason to browse a
    // business's orders/customers, and no reason to sit in Super
    // Admin's business/user-management screens either.
    if (
      role === "system_admin" &&
      !isPublic &&
      !SYSTEM_ADMIN_ALLOWED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = SYSTEM_ADMIN_HOME;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
