"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AuthCover } from "@/components/auth/AuthCover";
import { submitBusinessSignup } from "./actions";

type Step = "account" | "ghana-card" | "selfie" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "account", label: "Business & Owner" },
  { key: "ghana-card", label: "Ghana Card" },
  { key: "selfie", label: "Facial Verification" },
  { key: "review", label: "Review & Submit" },
];

function StepDots({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {STEPS.map((s, i) => (
        <div
          key={s.key}
          className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-gold" : "bg-sunken"}`}
          title={s.label}
        />
      ))}
    </div>
  );
}

function FilePreview({
  file,
  onPick,
  label,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
  label: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-36 object-cover rounded-sm border border-border" />
          <button
            type="button"
            onClick={() => onPick(null)}
            className="absolute top-2 right-2 bg-white/90 text-ink-muted text-xs font-semibold rounded-full px-2.5 py-1 border border-border"
          >
            Change
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-36 rounded-sm border-2 border-dashed border-border-strong bg-sunken cursor-pointer text-ink-muted text-xs hover:border-gold">
          <span className="text-lg mb-1">📷</span>
          Tap to upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

export function SignupForm() {
  const [step, setStep] = useState<Step>("account");
  const [businessName, setBusinessName] = useState("");
  const [region, setRegion] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ghanaCardNumber, setGhanaCardNumber] = useState("");
  const [cardFront, setCardFront] = useState<File | null>(null);
  const [cardBack, setCardBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reviewPreviews = useMemo(
    () => [cardFront, cardBack, selfie].filter(Boolean).map((f) => URL.createObjectURL(f as File)),
    [cardFront, cardBack, selfie]
  );
  useEffect(() => {
    return () => reviewPreviews.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPreviews]);

  function validateAccountStep() {
    if (!businessName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      return "Please fill in every field.";
    }
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords don't match.";
    return null;
  }

  function validateGhanaCardStep() {
    if (!/^GHA-\d{9}-\d$/i.test(ghanaCardNumber.trim())) {
      return "Ghana Card number should look like GHA-123456789-0.";
    }
    if (!cardFront) return "Upload the front of the Ghana Card.";
    if (!cardBack) return "Upload the back of the Ghana Card.";
    return null;
  }

  function goNext() {
    setError(null);
    if (step === "account") {
      const err = validateAccountStep();
      if (err) return setError(err);
      setStep("ghana-card");
    } else if (step === "ghana-card") {
      const err = validateGhanaCardStep();
      if (err) return setError(err);
      setStep("selfie");
    } else if (step === "selfie") {
      if (!selfie) return setError("Capture a selfie to continue.");
      setStep("review");
    }
  }

  function goBack() {
    setError(null);
    if (step === "ghana-card") setStep("account");
    else if (step === "selfie") setStep("ghana-card");
    else if (step === "review") setStep("selfie");
  }

  async function handleSubmit() {
    if (!cardFront || !cardBack || !selfie) {
      setError("Something's missing — please go back and check each step.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("business_name", businessName.trim());
    fd.set("region", region.trim());
    fd.set("owner_name", ownerName.trim());
    fd.set("owner_email", ownerEmail.trim());
    fd.set("password", password);
    fd.set("ghana_card_number", ghanaCardNumber.trim().toUpperCase());
    fd.set("ghana_card_front", cardFront);
    fd.set("ghana_card_back", cardBack);
    fd.set("selfie", selfie);

    const result = await submitBusinessSignup(fd);
    // A successful call redirects server-side and never returns here.
    if (result?.error) {
      setSubmitting(false);
      setError(result.error);
    }
  }

  return (
    <AuthCover mode="signup">
      <div className="card p-6">
        <div className="text-center mb-1">
          <div className="font-display font-bold text-lg text-ink">Create your business account</div>
          <div className="text-xs text-ink-muted mb-4">{STEPS.find((s) => s.key === step)?.label}</div>
        </div>
        <StepDots current={step} />

        {step === "account" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Business name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Comfort's Tailoring"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Region / City</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Kumasi"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3 mt-3">
                You, the owner
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Your full name</label>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="As it appears on your Ghana Card"
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "ghana-card" && (
          <div className="space-y-4">
            <div className="callout text-xs">
              We verify every new business against a Ghana Card before it goes live. Your Owner
              account stays in review until Sewsiness confirms it — usually within a day.
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Ghana Card number</label>
              <input
                value={ghanaCardNumber}
                onChange={(e) => setGhanaCardNumber(e.target.value)}
                placeholder="GHA-123456789-0"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-gold font-mono"
              />
            </div>
            <FilePreview file={cardFront} onPick={setCardFront} label="Ghana Card — front" />
            <FilePreview file={cardBack} onPick={setCardBack} label="Ghana Card — back" />
          </div>
        )}

        {step === "selfie" && <SelfieCapture selfie={selfie} onCapture={setSelfie} />}

        {step === "review" && (
          <div className="space-y-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-ink-muted">Business</span>
                <span className="font-medium text-ink">{businessName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-ink-muted">Owner</span>
                <span className="font-medium text-ink">{ownerName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-ink-muted">Email</span>
                <span className="font-medium text-ink">{ownerEmail}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-ink-muted">Ghana Card</span>
                <span className="font-medium text-ink font-mono">{ghanaCardNumber.toUpperCase()}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {reviewPreviews.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-sm border border-border" />
              ))}
            </div>
            <div className="callout text-xs">
              By submitting, you confirm this Ghana Card and selfie are genuinely yours. Your
              account won&rsquo;t be able to sign in until Sewsiness approves your verification.
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-sm px-3 py-2 mt-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mt-5">
          {step !== "account" && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-border-strong text-ink bg-surface hover:bg-sunken text-sm font-semibold px-4 py-2.5"
            >
              Back
            </button>
          )}
          {step !== "review" ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-sm bg-gold text-[#3a2400] font-semibold text-sm py-2.5 hover:brightness-105 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit for verification"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-ink-faint text-center pt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthCover>
  );
}

function SelfieCapture({ selfie, onCapture }: { selfie: File | null; onCapture: (f: File | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (selfie) {
      const url = URL.createObjectURL(selfie);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [selfie]);

  useEffect(() => {
    if (selfie) return; // already captured — don't hold the camera open
    let cancelled = false;
    setCamError(null);
    setReady(false);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setCamError("Couldn't access your camera. Please allow camera permission and try again."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [selfie]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror, so the preview matches what they saw
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  return (
    <div className="space-y-3">
      <div className="callout text-xs">
        Live capture only — this confirms a real person is signing up, not just a photo of one. It's
        compared against your Ghana Card photo during review.
      </div>
      <div className="relative w-full aspect-square rounded-sm overflow-hidden bg-sunken border border-border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Captured selfie" className="w-full h-full object-cover" />
        ) : camError ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-ink-muted p-4">
            {camError}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex justify-center">
        {preview ? (
          <button
            type="button"
            onClick={() => onCapture(null)}
            className="rounded-lg border border-border-strong text-ink bg-surface hover:bg-sunken text-sm font-semibold px-4 py-2.5"
          >
            Retake
          </button>
        ) : (
          <button
            type="button"
            onClick={capture}
            disabled={!ready}
            className="rounded-full bg-gold text-[#3a2400] font-semibold w-16 h-16 disabled:opacity-50 border-4 border-white shadow-lg"
            aria-label="Capture selfie"
          >
            ●
          </button>
        )}
      </div>
    </div>
  );
}
