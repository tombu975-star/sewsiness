-- ============================================================
-- 021_pin_search_path_set_updated_at.sql
--
-- set_updated_at() (017) was defined without `set search_path`, unlike
-- every other function in this schema. A mutable search_path on a
-- SECURITY DEFINER or trigger function is a known Postgres privilege-
-- escalation vector (a malicious search_path could resolve an
-- unqualified identifier to an attacker-controlled object). Low actual
-- risk here specifically (this function only ever does `new.updated_at
-- = now()`, nothing schema-lookup-dependent), but pinning it costs
-- nothing and keeps every function in this codebase consistent.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
