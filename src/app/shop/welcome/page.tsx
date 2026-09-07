import { Button } from "@/components/Button";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-8">
      <div className="relative mx-4 mt-4 h-[58vh] min-h-[400px] overflow-hidden rounded-[28px] bg-indigo">
        <svg viewBox="0 0 400 520" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1b2a4d" />
              <stop offset="100%" stopColor="#0e1830" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#heroBg)" />
          <g opacity="0.9">
            <ellipse cx="200" cy="150" rx="34" ry="40" fill="#f5c99b" />
            <path
              d="M120 210c0-38 36-58 80-58s80 20 80 58l14 170c2 22-16 40-38 40H144c-22 0-40-18-38-40l14-170Z"
              fill="#fbbf24"
            />
            <path d="M150 200c18 14 82 14 100 0" stroke="#0e1830" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="94" y="330" width="212" height="10" rx="5" fill="#0e1830" opacity="0.25" />
          </g>
          <g stroke="#e7eaf3" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
            <path d="M60 430c30-20 60 20 90 0s60-20 90 0 60 20 90 0" />
          </g>
          <circle cx="330" cy="90" r="3" fill="#fbbf24" />
          <circle cx="60" cy="120" r="3" fill="#fbbf24" />
          <circle cx="300" cy="440" r="3" fill="#e7eaf3" />
        </svg>
      </div>

      <div className="flex flex-1 flex-col items-center px-8 pt-8 text-center">
        <h1 className="font-display text-[26px] font-semibold text-ink">Tailor-made clothing</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Tailor-made clothing offers unmatched comfort, style, and precision.
        </p>
        <Button href="/shop/home" className="mt-6 w-full py-3.5 text-base">
          Get started
        </Button>
      </div>
    </div>
  );
}
