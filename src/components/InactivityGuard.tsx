"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logSignOut } from "@/app/(app)/audit/actions";

// Security requirement: an authenticated session left open on a shared or
// public device is a real data-leak vector — this is what closes it.
//
// Defaults match common SaaS practice: 15 minutes idle triggers a warning,
// signed out automatically 2 minutes later if there's still no activity.
// Only genuine user activity resets the clock (mouse, keys, touch, scroll,
// click) — NOT background polling/fetches, so a tab left open silently
// making network requests still times out as expected.
const IDLE_WARNING_MS = 13 * 60 * 1000; // warn at 13 minutes idle
const IDLE_LOGOUT_MS = 15 * 60 * 1000; // sign out at 15 minutes idle
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
const ACTIVITY_THROTTLE_MS = 5000; // don't re-arm timers on every single pixel of mouse movement

export function InactivityGuard() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReset = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const signOutForInactivity = useCallback(async () => {
    clearAllTimers();
    try {
      await logSignOut("inactivity");
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      // Best-effort clear of anything a page might have cached client-side
      // (drafts, filters, etc.) before leaving — sensitive business data
      // should not linger in memory/sessionStorage past sign-out.
      try {
        window.sessionStorage.clear();
      } catch {
        // ignore — storage may be unavailable (private browsing, etc.)
      }
      // Full browser navigation, not router.push — guarantees the
      // Router Cache is discarded, same reasoning as AppShell's manual
      // sign-out, so no authenticated page can flash back via back-nav.
      window.location.assign("/login?notice=inactivity");
    }
  }, [clearAllTimers]);

  const armTimers = useCallback(() => {
    clearAllTimers();
    setSecondsLeft(null);
    warningTimer.current = setTimeout(() => {
      setSecondsLeft(Math.round((IDLE_LOGOUT_MS - IDLE_WARNING_MS) / 1000));
      countdownInterval.current = setInterval(() => {
        setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)));
      }, 1000);
    }, IDLE_WARNING_MS);
    logoutTimer.current = setTimeout(signOutForInactivity, IDLE_LOGOUT_MS);
  }, [clearAllTimers, signOutForInactivity]);

  useEffect(() => {
    function handleActivity() {
      const now = Date.now();
      // Once the warning is showing, only the explicit "Stay signed in"
      // button should dismiss it — plain mouse movement while reading the
      // warning shouldn't silently re-arm without the person noticing.
      if (secondsLeft !== null) return;
      if (now - lastReset.current < ACTIVITY_THROTTLE_MS) return;
      lastReset.current = now;
      armTimers();
    }

    armTimers();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function staySignedIn() {
    lastReset.current = Date.now();
    armTimers();
  }

  if (secondsLeft === null) return null;

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true" aria-labelledby="inactivity-title">
      <div className="card w-full max-w-sm p-6 text-center">
        <div id="inactivity-title" className="font-display text-lg font-semibold text-ink mb-1.5">
          Your session is about to expire
        </div>
        <p className="text-sm text-ink-muted mb-4">
          You've been inactive for a while. For your business's security, you'll be signed out in{" "}
          <span className="font-semibold text-ink">
            {mm}:{ss}
          </span>
          .
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={staySignedIn}
            className="w-full rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 transition"
            autoFocus
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={signOutForInactivity}
            className="w-full rounded-sm border border-border text-ink-muted font-semibold text-sm py-2.5 hover:bg-sunken transition"
          >
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
