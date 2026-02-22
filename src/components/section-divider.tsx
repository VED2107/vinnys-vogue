/**
 * ✅ Server component — CSS-only animations, zero JS
 * Thin gold line with a centered diamond icon.
 * Fades in with CSS animation.
 */
export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-4 py-2 ${className}`}
      style={{ animation: "fadeInSoft 1.6s cubic-bezier(0.22,1,0.36,1) forwards" }}
    >
      <div
        className="h-px w-16 origin-right"
        style={{
          background: "linear-gradient(90deg, transparent, #C6A75E)",
          transform: "scaleX(0)",
          animation: "scaleXIn 1.4s cubic-bezier(0.22,1,0.36,1) 0.1s forwards",
        }}
      />
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M5 0 L10 5 L5 10 L0 5Z"
          fill="none"
          stroke="#C6A75E"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </svg>
      <div
        className="h-px w-16 origin-left"
        style={{
          background: "linear-gradient(90deg, #C6A75E, transparent)",
          transform: "scaleX(0)",
          animation: "scaleXIn 1.4s cubic-bezier(0.22,1,0.36,1) 0.1s forwards",
        }}
      />
    </div>
  );
}

/**
 * ✅ Server component — CSS-only animation, zero JS
 * Minimal geometric watermark pattern for backgrounds.
 */
export function GeometricWatermark({
  variant = 0,
  className = "",
}: {
  variant?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ animation: "fadeInSoft 2s cubic-bezier(0.22,1,0.36,1) forwards" }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        style={{ opacity: 0.04 }}
      >
        <defs>
          <linearGradient id={`wm-g-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>

        <g stroke={`url(#wm-g-${variant})`} strokeWidth="0.5">
          {variant === 0 && (
            <>
              {/* Concentric squares rotated */}
              <rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
              <rect x="55" y="55" width="90" height="90" transform="rotate(45 100 100)" />
              <rect x="70" y="70" width="60" height="60" transform="rotate(45 100 100)" />
              <circle cx="100" cy="100" r="15" />
            </>
          )}

          {variant === 1 && (
            <>
              {/* Interlocking arcs */}
              {[0, 90, 180, 270].map((a) => (
                <g key={a} transform={`rotate(${a} 100 100)`}>
                  <path d="M100 20 Q140 60 100 100" />
                  <path d="M100 35 Q130 65 100 95" />
                </g>
              ))}
              <circle cx="100" cy="100" r="10" />
            </>
          )}

          {variant === 2 && (
            <>
              {/* Radiating lines with dots */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 100 + 25 * Math.cos(angle);
                const y1 = 100 + 25 * Math.sin(angle);
                const x2 = 100 + 85 * Math.cos(angle);
                const y2 = 100 + 85 * Math.sin(angle);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
              <circle cx="100" cy="100" r="25" strokeDasharray="4 6" />
              <circle cx="100" cy="100" r="85" strokeDasharray="3 8" />
            </>
          )}

          {variant === 3 && (
            <>
              {/* Nested triangles */}
              <polygon points="100,15 185,160 15,160" />
              <polygon points="100,45 165,150 35,150" />
              <polygon points="100,75 145,140 55,140" />
              <circle cx="100" cy="115" r="12" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
