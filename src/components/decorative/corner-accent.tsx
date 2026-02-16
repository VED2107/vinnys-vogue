/**
 * CornerAccent — Corner decorative motif with thin gold line art.
 * Two variants: "diamond" and "floral".
 * Place inside a relative container. pointer-events: none, behind content.
 */
export function CornerAccent({
  variant = "diamond",
  position = "top-right",
  className = "",
}: {
  variant?: "diamond" | "floral";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}) {
  const posMap: Record<string, string> = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  const flipX = position.includes("left") ? "scale(-1,1)" : "";
  const flipY = position.includes("bottom") ? "scale(1,-1)" : "";
  const transform = [flipX, flipY].filter(Boolean).join(" ");

  return (
    <div
      className={`pointer-events-none absolute ${posMap[position]} z-0 ${className}`}
      aria-hidden="true"
      style={transform ? { transform } : undefined}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[120px] w-[120px] lg:h-[200px] lg:w-[200px]"
        style={{ opacity: variant === "diamond" ? 0.055 : 0.05 }}
      >
        <defs>
          <linearGradient id={`ca-g-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>

        {variant === "diamond" ? (
          <g stroke={`url(#ca-g-${variant})`} strokeWidth="0.5">
            <path d="M10 10 L10 120 Q10 140 30 140 L140 140" strokeDasharray="6 10" />
            <path d="M10 10 L10 100 Q10 110 20 110 L110 110" />
            <path d="M10 10 L10 80 Q10 85 15 85 L85 85" strokeDasharray="4 8" />
            <path d="M30 30 L70 30 L70 70 L30 70Z" />
            <path d="M50 20 L80 50 L50 80 L20 50Z" strokeDasharray="3 6" />
            <circle cx="50" cy="50" r="12" />
            <circle cx="50" cy="50" r="6" strokeDasharray="2 4" />
            <path d="M90 90 L130 90 L130 130 L90 130Z" strokeDasharray="4 8" />
            <path d="M110 85 L135 110 L110 135 L85 110Z" />
          </g>
        ) : (
          <g stroke={`url(#ca-g-${variant})`} strokeWidth="0.5">
            <path d="M10 10 Q10 80 40 110 Q60 130 140 140" />
            <path d="M10 10 Q10 60 30 80 Q50 100 110 110" strokeDasharray="4 8" />
            <path d="M10 10 Q10 40 25 55 Q40 70 80 80" strokeDasharray="3 10" />
            <path d="M20 50 Q30 30 50 20" />
            <path d="M50 90 Q70 70 90 50" />
            <circle cx="30" cy="30" r="8" />
            <circle cx="30" cy="30" r="4" strokeDasharray="2 3" />
            <path d="M70 120 Q80 100 100 90" />
            <circle cx="80" cy="80" r="5" />
            <path d="M120 135 Q130 125 135 115" strokeDasharray="3 5" />
          </g>
        )}
      </svg>
    </div>
  );
}
