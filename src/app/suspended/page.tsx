import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="card max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-4 text-xl">
          ⛔
        </div>
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Account suspended</h1>
        <p className="text-sm text-ink-muted mb-6">
          This account has been suspended by a platform administrator. You&rsquo;ve been signed out. If you
          believe this is a mistake, contact your business owner or Sewsiness support.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-gold text-[#3a2400] font-semibold text-sm px-4 py-2.5 hover:brightness-105"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
