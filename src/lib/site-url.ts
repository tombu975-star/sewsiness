// Where invite/recovery emails send people back to. Set NEXT_PUBLIC_SITE_URL
// in production (Render/Vercel env vars) to your real deployed URL — without
// it, invite links fall back to localhost, which only works on your own
// machine.
//
// IMPORTANT — this also needs one manual step in the Supabase dashboard:
// Authentication → URL Configuration → Redirect URLs must include
// `${SITE_URL}/accept-invite` (an entry like `https://your-app.onrender.com/**`
// covers this and any future auth redirect page). Supabase silently ignores
// `redirectTo` and falls back to its default Site URL if the exact URL isn't
// allow-listed there — easy to miss, not optional.
export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}
