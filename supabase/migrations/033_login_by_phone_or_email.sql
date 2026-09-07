-- ============================================================
-- 033_login_by_phone_or_email.sql
--
-- LoginForm.tsx signs in with `supabase.auth.signInWithPassword()`,
-- which needs an email (this project doesn't have Supabase's own phone
-- + SMS-OTP auth turned on, and wiring that up needs a paid SMS
-- provider, which is out of scope here). So "log in with phone number"
-- is implemented at the app level instead: the login field now accepts
-- either an email or the phone number already collected on `profiles`
-- (see 015_auth_screen_redesign.sql), and resolves whichever the person
-- typed to the real account email in Postgres *before* calling
-- signInWithPassword() with that email — this function is that
-- resolution step.
--
-- SECURITY DEFINER (same shape as the login-rate-limiting functions in
-- 027) because it's called by `anon` — there's no session yet at the
-- login screen — and needs to read across `profiles` + `auth.users`,
-- which anon can't do directly. It reveals nothing an attacker couldn't
-- already learn from the login form itself: if the phone doesn't match
-- any account, this just returns null and LoginForm falls through to
-- signing in with the raw typed value, which fails with Supabase's own
-- generic "Invalid login credentials" — never a distinct "no such
-- phone" message.
--
-- Phone numbers aren't stored in one normalized format (see
-- InviteStaffForm / onboarding, which just take free-text), so this
-- compares digits-only, and also compares by the last 9 digits alone —
-- covers a stored "0241234567" matching a typed "+233241234567" (or
-- vice versa) without needing everyone's existing `profiles.phone`
-- value backfilled to one format first.
--
-- Additive and safe to run against the live database as-is.
-- ============================================================

create or replace function resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  cleaned text := trim(coalesce(p_identifier, ''));
  digits text;
  found_email text;
begin
  if cleaned = '' then
    return null;
  end if;

  -- Looks like an email already — just normalize and hand it back.
  if cleaned ilike '%@%' then
    return lower(cleaned);
  end if;

  -- Otherwise treat it as a phone number: strip everything but digits.
  digits := regexp_replace(cleaned, '\D', '', 'g');
  if digits = '' then
    return null;
  end if;

  select au.email into found_email
  from profiles p
  join auth.users au on au.id = p.id
  where p.phone is not null
    and (
      regexp_replace(p.phone, '\D', '', 'g') = digits
      or right(regexp_replace(p.phone, '\D', '', 'g'), 9) = right(digits, 9)
    )
  limit 1;

  return found_email;
end;
$$;

grant execute on function resolve_login_email(text) to anon, authenticated;
