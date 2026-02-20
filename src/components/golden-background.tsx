"use client";

/**
 * Global decorative gold background layer.
 * Placed once in layout.tsx — all pages inherit it.
 *
 * - Thin SVG line art only (no fills)
 * - 4–6% opacity, muted gold gradient
 * - Absolute positioned, pointer-events: none, behind content
 * - Responsive scaling
 * - Optional extremely slow rotation
 * - No heavy filters, no large duplication
 */
export function GoldenBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top-right mandala */}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -top-32 -right-32 w-[70vw] max-w-[700px] h-auto hidden sm:block animate-[spin_150s_linear_infinite]"
        style={{ opacity: 0.045 }}
      >
        <defs>
          <linearGradient id="gb-g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>
        <g stroke="url(#gb-g1)" strokeWidth="0.5">
          <circle cx="250" cy="250" r="230" strokeDasharray="6 14" />
          <circle cx="250" cy="250" r="210" strokeDasharray="3 20" />
          <circle cx="250" cy="250" r="190" strokeDasharray="8 10" />
          {/* 8-petal lotus */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <g key={a} transform={`rotate(${a} 250 250)`}>
              <path d="M250 55 Q263 125 250 175 Q237 125 250 55Z" />
            </g>
          ))}
          <circle cx="250" cy="250" r="40" />
          <circle cx="250" cy="250" r="25" strokeDasharray="4 8" />
        </g>
      </svg>

      {/* Bottom-left geometric */}
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -bottom-24 -left-24 w-[55vw] max-w-[550px] h-auto hidden sm:block animate-[spin_180s_linear_infinite_reverse]"
        style={{ opacity: 0.035 }}
      >
        <defs>
          <linearGradient id="gb-g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>
        <g stroke="url(#gb-g2)" strokeWidth="0.5">
          {/* Concentric diamonds */}
          <path d="M200 20 L380 200 L200 380 L20 200Z" strokeDasharray="8 12" />
          <path d="M200 60 L340 200 L200 340 L60 200Z" strokeDasharray="5 10" />
          <path d="M200 100 L300 200 L200 300 L100 200Z" />
          {/* Inner arcs */}
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a} 200 200)`}>
              <path d="M200 70 Q230 130 200 160" />
              <path d="M200 70 Q170 130 200 160" />
            </g>
          ))}
          <circle cx="200" cy="200" r="30" strokeDasharray="3 8" />
        </g>
      </svg>
    </div>
  );
}
