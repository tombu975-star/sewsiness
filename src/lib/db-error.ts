// Turns a raw database error into something safe to put in a server
// action's return value. This matters specifically for `return { error:
// ... }` responses — unlike a *thrown* error (which Next.js already
// redacts to a generic digest message in production by default), a
// value a server action explicitly returns goes straight to the client
// as-is. Several actions in this app return `error.message` from a
// Postgrest call, which can include real table/column/constraint names
// (e.g. `duplicate key value violates unique constraint
// "organizations_ghana_card_number_key"`) — schema-shape information
// that has no reason to reach the browser.
//
// Not used for Supabase Auth errors (inviteUserByEmail, createUser,
// signInWithPassword, etc.) — those come back with messages Supabase
// itself designed to be shown to end users ("User already registered",
// "Invalid login credentials"), so passing those through as-is is
// correct, not a leak.
//
// The full original error is always logged server-side (visible in
// server/function logs, never sent to the client) so nothing is lost
// for debugging.
export function toSafeErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  // eslint-disable-next-line no-console
  console.error("[db error]", error);

  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "23505": // unique_violation
      return "That already exists — check for a duplicate and try again.";
    case "23503": // foreign_key_violation
      return "That record is still linked elsewhere and can't be changed right now.";
    case "23514": // check_violation
      return "That value isn't valid for this field.";
    case "42501": // insufficient_privilege (RLS or grant denial)
      return "You don't have permission to do that.";
    default:
      return fallback;
  }
}
