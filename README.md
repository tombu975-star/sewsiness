# Sewiness — Fashion Business OS

A Next.js 14 (App Router) + Supabase multi-tenant management platform for
Ghanaian tailoring ateliers, built from the SEWSINESS wireframe sitemap.

Design system ("Atelier Ledger"): parchment/gold/burgundy palette, Fraunces
display type + IBM Plex Sans/Mono, dark navy sidebar with gold active-state
accent — ported 1:1 from the wireframe's CSS custom properties.

## What's built

The full wireframe sitemap is implemented — every sidebar link routes to a
real, Supabase-backed page with RLS, not a placeholder. 71 routes total.

**Core workflow**
- **Auth** — Supabase email/password. New businesses self-enroll at
  `/signup` (Ghana Card + live selfie, reviewed by Super Admin before the
  account can sign in); everyone else (Staff, Apprentice, Freelancer, etc.)
  is invited by their business. Password reset is code-based, not a magic
  link — see "Password reset" below. Session refresh + route protection via
  middleware.
- **Dashboard** — live KPIs (customers, active orders, revenue today,
  outstanding balance), recent orders, recent payments.
- **Customers** — list, create, detail (Overview / Orders / Payments /
  Measurements / Materials tabs).
- **Custom Orders** — list, create, detail with inline status updates,
  payment recording, and workflow tabs for **Production**, **Fittings**,
  **Alterations**, **Quality Control** and **Costing** (margin visible only
  to Owner/Manager/Super Admin).
- **Products** — list, create, detail with a stock adjuster and recent
  sales, plus Categories, Brands, Variants and Inventory views.
- **POS** — full terminal: product grid, cart, customer picker, payment
  method, checkout. Deducts stock and records a payment automatically.
- **Payments** — unified ledger, plus Receivables (computed from order
  balances) and Refunds (issue + history).

**People**
- **Staff / Apprentices / Freelancers** — invite-based self-service login:
  `supabase.auth.admin.inviteUserByEmail()` creates their `auth.users` row
  and emails a set-password link, then writes `profiles` plus the
  domain-specific fields into `apprentice_profiles` / `freelancer_profiles`.
  Apprentices and Freelancers sign in at the same `/login` as everyone else
  and see only their own dashboard, tasks/jobs and payments — enforced by
  `sidebarForRole()` in `src/lib/nav.ts`.
- **Workforce Hub** — combined rollup across Staff, Apprentices, Freelancers.
- **Training Plans / Portfolios** — trainer/owner assign tasks, apprentices
  see only their own; portfolio pieces scoped the same way.
- **Trainer Console / Madam Hub** — supervisory views over apprentices.
- **Freelancer Work Requests / Payment Ledger** — job offers with a status
  pipeline (Offered → Accepted → Completed → Paid) that both sides can see,
  scoped per-role.

**Materials & production**
- **Fabrics / Fabric Inventory** — stock with reorder-threshold styling.
- **Suppliers / Purchase Orders / Goods Received** — PO status pipeline
  (Pending → Ordered → Received).
- **Designs / Collections / Expenses / Branches** — standard list + create.
- **Measurements / Customer Materials** — logged per customer, also shown
  inline on the customer's own detail page.

**Reporting & admin**
- **Reports** — aggregated revenue/expense/profit view with CSV export.
- **Business Health** — a scored diagnostic (profit margin, collection
  rate, overdue orders, customer retention) blended into a 0–100 score.
- **Projections** — 30-day-average linear revenue projection, plus a
  **Make-It-Happen Planner** that reverse-engineers a revenue goal into a
  weekly target.
- **Notifications / Audit Log / Settings** — notification feed, an
  Owner/Super-Admin-only audit trail, and account/organization settings.

Role-aware navigation (`super_admin`, `system_admin`, `owner`, `manager`,
`staff`, `apprentice`, `freelancer`, `trainer`) is ported 1:1 from the
wireframe's `SIDEBAR` array — see `src/lib/nav.ts`.

**System Admin** — a second platform-level role, separate from Super
Admin: it's the developer's own account, not a business-operations
account. It never sees any business or customer data (same hard
server-side wall pattern as Super Admin, just around a different set of
pages). It gets three things at `/system`:
- **Feature Flags** (`/system/flags`) — decide which parts of the app are
  live. Gate any page/component with `isFeatureEnabled("key")` from
  `src/lib/feature-flags.ts`; new flags default OFF.
- **Integrations** (`/system/integrations`) — a registry of third-party
  providers and whether the env vars each one needs are actually set on
  this deployment. It never stores or displays secret values, only
  presence/absence of the env var — real keys stay in Vercel's
  environment variable settings.
- **Incidents** (`/system/incidents`) — a lightweight log for tracking
  something broken from the moment you notice it to the moment it's
  fixed, ideally before a business ever has to report it.

## What's not wired up yet

- **Photo uploads** — Portfolio pieces and product images are text-only
  right now; wire up Supabase Storage to add them.
- **Audit log writes** — the Audit Log page reads from `audit_logs`, but no
  mutation currently writes to it. Add an insert call to the actions you
  want tracked (invites, role changes, deletions are the obvious first set).
- **Email templates** — invites use Supabase's default email template;
  customize it in Supabase → Authentication → Email Templates for your
  brand voice.
- **Redirect URLs (required, not optional)** — Business enrollment and every
  Staff/Apprentice/Freelancer invite send people to `/accept-invite` to set
  their password (`src/lib/site-url.ts` builds that URL from
  `NEXT_PUBLIC_SITE_URL`). Supabase silently ignores that and falls back to
  its own default Site URL unless the exact URL is allow-listed at
  Supabase dashboard → Authentication → URL Configuration → Redirect URLs —
  add `${NEXT_PUBLIC_SITE_URL}/accept-invite`, or a wildcard like
  `https://your-app.vercel.app/**` to cover this and any future auth
  redirect page. Skipping this step is exactly what makes invites look like
  they silently do nothing.
- **Password reset email template** — `/forgot-password` has the person type
  a 6-digit code rather than click a link (`verifyOtp` under the hood, not
  `resetPasswordForEmail`'s default magic link). For that code to actually
  show up in the email, Supabase dashboard → Authentication → Email
  Templates → Reset Password must include `{{ .Token }}` — Supabase's own
  starter template already has this, but if it's been customized without
  it, the email will only contain a link and there'll be no code to type.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Supabase setup

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor — it creates all core tables,
   the `current_org_id()` / `current_role_name()` SECURITY DEFINER helpers
   (this is what avoids RLS infinite recursion / error 42P17 on `profiles`),
   RLS policies. Starts with zero businesses on purpose — see "Supabase
   setup" step 4 for how the first ones get in.
3. Run `supabase/migrations/002_platform_admin.sql` through
   `009_system_admin.sql`, in order, in the SQL editor. Together these power:
   - `002` — the Super Admin **Enrolled Businesses** screens (`/admin`): makes
     `profiles.organization_id` nullable (so a true platform-level Super
     Admin account isn't tied to any one business), adds `advisory_notes`,
     and adds two `SECURITY DEFINER` functions — `get_business_directory()`
     and `get_business_stage_breakdown()` — that hand Super Admin
     *operational signals only*, never revenue, invoices, or customer
     records.
   - `003`–`006` — real `audit_logs`, account suspension, the
     Apprentice/Freelancer workforce tables, freelancer verification, and
     the Roles & Permissions governance console (`/admin/roles`).
   - `007` — business branding (`logo_url`) and identity verification
     (Ghana Card number + front/back photo + live selfie, reviewed at
     `/admin/[id]`) for the self-service `/signup` flow, plus a **private**
     `kyc-documents` storage bucket for those photos.
   - `008` — security hardening: closes a privilege-escalation gap in the
     `profiles` self-update RLS policy (a signed-in user could otherwise
     change their own `role`/`organization_id`/`suspended_at` directly),
     and adds the missing `organizations` UPDATE policy.
   - `009` — adds the `system_admin` role plus `feature_flags`,
     `integration_checks`, and `system_incidents` (see "System Admin"
     above).
   All are additive and safe to run even if your database has drifted from
   `schema.sql`.
4. Create your platform accounts: **Authentication → Users → Add user**,
   then insert a matching row into `profiles` with that user's `id` — a
   `role` of `super_admin` for the business-operations account, or
   `system_admin` for your own developer account — and leave
   `organization_id` as `NULL` for either. From there, every actual
   tailoring business either self-enrolls at `/signup` (Ghana Card +
   selfie, needs Super Admin's approval at `/admin/[id]` before it can
   sign in) or Super Admin enrolls it directly with the **Enroll Business**
   button on `/admin` (that path skips the verification step — you're
   creating the account yourself).
5. Password reset is code-based (the person types a 6-digit code, not a
   magic-link click-through) — see `src/app/forgot-password/ForgotPasswordForm.tsx`
   for how. This needs one manual dashboard edit: **Authentication → Email
   Templates → Reset Password** must include `{{ .Token }}` (Supabase's own
   starter template already does). Without it, the reset email only has a
   link and there's no code for the recipient to type.
6. Once your schema is stable, regenerate real types:
   `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
7. Run `supabase/migrations/032_invite_expiry_and_resend.sql` through
   `035_seed_sample_advertisements.sql`, in order. `032` adds an
   `invites` table so Staff/Freelancer/Apprentice invite links expire
   after 30 minutes (enforced by this app, independent of whatever
   Supabase's own **Authentication → Auth → Email OTP Expiration**
   setting allows) and can be resent from a "Resend invite" button once
   they do. `033` lets the login screen accept a phone number in
   addition to email. `034`/`035` add the rolling advertisement slides
   on the `/login` splash screen (Settings → Platform Branding, Super
   Admin only, manages these — `035` just seeds two starter samples so
   the rotation is visible immediately instead of looking identical to
   plain image rotation until someone adds one). All are additive, no
   manual dashboard step required — resend deliberately uses the
   **Magic Link** email (not Reset Password, which step 5 above already
   repurposed for a typed code) so the invitee still gets a clickable
   link.
8. Run `supabase/migrations/034_platform_advertisements.sql`. Adds an
   `advertisements` column to `platform_settings` so Super Admin can
   configure rolling ad slides (image + headline + optional caption/
   link) from Settings → Platform Branding — these roll into the
   /login splash screen's rotation alongside the plain cover images
   (see LoginSplash.tsx). Additive, no manual dashboard step required.

## Before you go live

A few things that only matter once real customers, not test accounts,
depend on this working:

1. **Configure a real SMTP provider in Supabase — do this before
   inviting a single real user.** Every email this app sends (invites,
   password reset, magic-link resend) goes through Supabase Auth's own
   mailer, not this app's code — and Supabase's *default* mailer is a
   shared, heavily rate-limited sender meant for testing only (a
   handful of emails per hour), not real traffic. Past that limit,
   invites and password resets don't error, they just silently stop
   arriving. Fix: **Supabase dashboard → Authentication → Emails →
   SMTP Settings**, pointed at a real provider (the app already expects
   **Resend** specifically — see the seeded row in `integration_checks`
   from `009_system_admin.sql`, and the System Admin → Integrations
   screen, which will show it as "Not configured" until this is done).
   This is a dashboard setting, not something any migration or env var
   here can do for you.
2. **Set `NEXT_PUBLIC_SITE_URL` and the Supabase Redirect URL
   allow-list** to your real domain — see the Vercel section above.
   Skipping this is the second most common reason invite/reset links
   look broken.
3. **Never run `supabase/seed_demo_users.sql` against this database.**
   It creates 8 accounts with a shared, plaintext password printed at
   the top of that file. If it's already been run against this project
   while testing, delete those accounts first — deleting `auth.users`
   rows matching `@demo.sewsiness.test` cascades to remove everything
   else the script created (see that file's own cleanup block for the
   exact query).
4. **Error/uptime monitoring isn't set up.** Nothing in this codebase
   reports exceptions anywhere (no Sentry or equivalent) — a failure in
   production is currently only visible in Vercel's function logs. Not
   a blocker for a first launch, but worth adding before relying on
   this for real revenue.
5. **Payments are recorded, not processed.** `payments.method` includes
   "Mobile Money" and "Card" as labels on a manually-entered ledger
   entry — there's no live payment gateway integration (Paystack is
   seeded in `integration_checks` as a likely next step, but isn't
   wired to anything yet). Nothing in the app currently touches real
   money automatically.
6. **Database backups.** Supabase's own automatic backup schedule
   depends on your project's plan tier — worth confirming point-in-time
   recovery is actually enabled at whatever tier you're on, since that's
   a Supabase billing/plan setting, not something a migration controls.

## Deploying

### Vercel

Deploys with zero config — Vercel auto-detects Next.js, no `vercel.json` needed.

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo at vercel.com/new for automatic deploys on every push.

Set these in the Vercel project's **Settings → Environment Variables**
(same values as your `.env.local`) — all four, not just the two public
ones:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; required for signup, invites,
  and every admin action that uses `createAdminClient()`. Never marked
  `NEXT_PUBLIC_*`, so Vercel keeps it out of the browser bundle.
- `NEXT_PUBLIC_SITE_URL` — your real deployed URL (e.g.
  `https://your-app.vercel.app`, or your custom domain once attached).
  Without this, invite/recovery emails link back to `localhost`.

Then, in Supabase → **Authentication → URL Configuration → Redirect
URLs**, add `${NEXT_PUBLIC_SITE_URL}/accept-invite` (or a wildcard like
`https://your-app.vercel.app/**` to cover this and any future auth
redirect page). Supabase silently falls back to its own default Site URL
if the exact URL isn't allow-listed here — this is the single most common
reason invites/recovery links look like they silently do nothing.

Client IP extraction for rate limiting (signup, password recovery — see
`src/app/signup/actions.ts` and `src/app/forgot-account/actions.ts`) reads
Vercel's `x-vercel-forwarded-for` header, which Vercel guarantees can't be
spoofed by an external client. No extra configuration needed; this only
matters if you ever move off Vercel, in which case that header won't be
present and both files fall back to plain `x-forwarded-for`.

## Notes carried over from the product blueprint

- **Costing is restricted** — the Costing page and the order detail page's
  Costing tab both check the signed-in profile's role server-side (Owner,
  Manager, Super Admin only) before rendering figures, and the
  `order_costs` table has its own RLS policy on top of that using
  `current_role_name()`. `cost_price` on `products` still isn't behind that
  same boundary — split it into its own RLS-gated table if Staff shouldn't
  see per-product margins either.
- **Madams cannot enroll other Madams** — not yet enforced in the invite
  action; add a role check in `src/app/(app)/apprentices/actions.ts` if you
  need this rule server-side rather than just via UI omission.
- Project-tracking tools (internal build trackers) should live in a separate
  shell outside this product, not in the sidebar — this app doesn't include
  any, by design.

## Login splash
The real `/login` route now uses `src/app/login/LoginSplash.tsx`. The splash displays the configured platform logo/cover imagery, rotates configured images during the splash, then reveals the existing Supabase login form. It is independent from the landing-page carousel and does not change the authentication logic.
