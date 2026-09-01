// Shared shape for Server Actions used with React's useFormState, so
// failures (a duplicate invite email, a permission check, a bad role
// selection) show inline on the form instead of crashing to Next.js's
// generic "Application error: a server-side exception has occurred"
// page — see src/app/(app)/admin/actions.ts and staff/actions.ts for
// the pattern this supports.
export type ActionState = { error?: string };

export const initialActionState: ActionState = {};

// next/navigation's redirect() and notFound() work by throwing a special
// error with a `digest` starting in "NEXT_REDIRECT" / "NEXT_NOT_FOUND",
// which the framework catches higher up the tree. If an action's own
// try/catch swallows that throw, the redirect silently never happens.
// Call this first in any catch block that wraps a redirect()/notFound()
// call, and rethrow when it returns true.
export function isFrameworkSignal(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    /^NEXT_(REDIRECT|NOT_FOUND)/.test((err as { digest: string }).digest)
  );
}
