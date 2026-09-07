-- ============================================================
-- 032_invite_expiry_and_resend.sql
--
-- Staff / Freelancer / Apprentice invites (see (app)/staff/actions.ts,
-- freelancers/actions.ts, apprentices/actions.ts) call
-- `admin.auth.admin.inviteUserByEmail()`, which relies entirely on
-- Supabase's own project-wide "Mailer OTP Expiration" setting for how
-- long the emailed link stays valid — there was no way to enforce a
-- shorter, product-specific window from application code, and no way
-- to send a fresh link at all once the first one expired (calling
-- inviteUserByEmail a second time for the same address fails with
-- "User already registered", since the first invite already created
-- the auth.users row).
--
-- This migration adds an app-level `invites` table that tracks its own
-- expiry independently of whatever Supabase's dashboard is configured
-- to allow. The accept-invite screen (see
-- src/app/accept-invite/AcceptInviteForm.tsx) checks this table's
-- `expires_at` in addition to whether Supabase itself accepted the
-- link — so even a project configured with a long OTP window still
-- honours this app's 30-minute rule. "Resend" (see
-- src/lib/invite-actions.ts) uses `auth.signInWithOtp()` (the Magic Link
-- flow, not Reset Password — this app has repurposed Reset Password's
-- template elsewhere for a typed code, see
-- forgot-password/ForgotPasswordForm.tsx, so reusing it here would send
-- a code with no clickable link) — that issues a brand-new token that
-- invalidates the previous one for an existing, not-yet-confirmed user,
-- then bumps `expires_at` another 30 minutes here.
--
-- Written by the service-role client only (see createAdminClient() in
-- src/lib/supabase/admin.ts), which bypasses RLS entirely — so, same
-- reasoning as `profiles` in schema.sql, there are no INSERT/UPDATE
-- policies below, only SELECT ones for the two people who legitimately
-- need to read a row: the org's own Owner/Manager (to show a "pending /
-- expires in Xm / expired" badge and a Resend button on the Staff,
-- Freelancers and Apprentices pages) and the invited user themselves
-- (to know client-side whether their own link is still within this
-- app's window). Accepting an invite updates this table too, but only
-- through the narrow `mark_own_invite_accepted()` function below —
-- never a raw UPDATE policy — so a signed-in invitee can flip their own
-- row to "accepted" and nothing else.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create table if not exists invites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text,
  invited_by uuid references profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null,
  resend_count integer not null default 0,
  resent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_invites_org on invites (organization_id);
create index if not exists idx_invites_user on invites (user_id);

alter table invites enable row level security;

drop policy if exists "owner/manager can read own org invites" on invites;
create policy "owner/manager can read own org invites" on invites
  for select using (
    organization_id = current_org_id()
    and current_role_name() in ('owner', 'manager')
  );

drop policy if exists "invited user can read own invite" on invites;
create policy "invited user can read own invite" on invites
  for select using (user_id = auth.uid());

-- Called client-side by AcceptInviteForm right after the invitee sets
-- their password. SECURITY DEFINER so it can write despite there being
-- no general UPDATE policy, but it only ever touches the caller's own
-- still-pending row — never anyone else's, and never any column other
-- than status/accepted_at.
create or replace function mark_own_invite_accepted()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update invites
  set status = 'accepted', accepted_at = now()
  where user_id = auth.uid() and status = 'pending';
end;
$$;

grant execute on function mark_own_invite_accepted() to authenticated;
