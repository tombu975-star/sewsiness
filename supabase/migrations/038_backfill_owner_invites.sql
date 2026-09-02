-- ============================================================
-- 038_backfill_owner_invites.sql
--
-- src/app/(app)/admin/actions.ts's enrollBusiness() invited the owner
-- via inviteUserByEmail() but never called recordInvite() afterward —
-- every other invite path (staff/apprentices/freelancers/actions.ts)
-- does. Result: no row in `invites` for any business owner enrolled
-- before this was fixed, so /admin/users (src/app/(app)/admin/users/page.tsx)
-- has nothing to look up and the Resend button never renders for them —
-- this is the bug this migration backfills around. The application
-- code is fixed separately; this repairs data for businesses that
-- already went through the old, incomplete path.
--
-- Status is inferred from auth.users.email_confirmed_at: if the owner
-- has already confirmed their email (set a password via the original
-- invite), the backfilled row is 'accepted' — matching
-- resendInvite()'s existing "already accepted" branch, which sends a
-- fresh link to set a *new* password rather than treating it as a
-- first-time invite. If never confirmed, it's 'pending' with a fresh
-- 30-minute expiry; resending will issue a brand-new link regardless,
-- so this starting value is never load-bearing on its own.
--
-- Only inserts for owners with no existing invites row at all — an
-- owner already correctly tracked (enrolled after the code fix) is
-- left untouched by the `not exists` guard below.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

insert into invites (organization_id, user_id, email, full_name, role, status, expires_at, accepted_at)
select
  p.organization_id,
  p.id,
  u.email,
  p.full_name,
  'owner',
  case when u.email_confirmed_at is not null then 'accepted' else 'pending' end,
  case when u.email_confirmed_at is not null then u.email_confirmed_at else now() + interval '30 minutes' end,
  u.email_confirmed_at
from profiles p
join auth.users u on u.id = p.id
where p.role = 'owner'
  and p.organization_id is not null
  and not exists (select 1 from invites i where i.user_id = p.id);
