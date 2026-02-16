/**
 * EmbroideryFrame — Half-arch floral frame or vertical embroidery border.
 * Two variants: "arch" and "vertical".
 * Place inside a relative container. pointer-events: none, behind content.
 */
export function EmbroideryFrame({
  variant = "arch",
  position = "top-right",
  className = "",
}: {
  variant?: "arch" | "vertical";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}) {
  const positionClasses: Record<string, string> = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  if (variant === "vertical") {
    return (
      <div
        className={`pointer-events-none absolute ${positionClasses[position]} z-0 ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 60 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[400px] w-[40px] lg:h-[600px] lg:w-[60px]"
          style={{ opacity: 0.055 }}
        >
          <defs>
            <linearGradient id="ef-v" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C6A75E" />
              <stop offset="100%" stopColor="#E8D4A2" />
            </linearGradient>
          </defs>
          <g stroke="url(#ef-v)" strokeWidth="0.5">
            <line x1="30" y1="0" x2="30" y2="600" strokeDasharray="8 16" />
            <line x1="15" y1="0" x2="15" y2="600" strokeDasharray="4 24" />
            <line x1="45" y1="0" x2="45" y2="600" strokeDasharray="4 24" />
            {[0, 80, 160, 240, 320, 400, 480, 560].map((y) => (
              <g key={y}>
                <path d={`M15 ${y} Q30 ${y + 20} 45 ${y}`} />
                <path d={`M15 ${y + 40} Q30 ${y + 20} 45 ${y + 40}`} />
                <circle cx="30" cy={y + 20} r="3" />
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute ${positionClasses[position]} z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[200px] w-[280px] lg:h-[300px] lg:w-[400px]"
        style={{ opacity: 0.05 }}
      >
        <defs>
          <linearGradient id="ef-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>
        <g stroke="url(#ef-a)" strokeWidth="0.5">
          <path d="M20 280 Q20 40 200 20 Q380 40 380 280" strokeDasharray="6 10" />
          <path d="M50 280 Q50 80 200 60 Q350 80 350 280" />
          <path d="M80 280 Q80 120 200 100 Q320 120 320 280" strokeDasharray="4 12" />
          {[60, 120, 180, 240, 300, 340].map((x) => (
            <g key={x}>
              <path d={`M${x} ${280 - Math.abs(x - 200) * 0.5} Q${x + 10} ${260 - Math.abs(x - 200) * 0.5} ${x + 20} ${280 - Math.abs(x - 200) * 0.5}`} />
            </g>
          ))}
          <circle cx="200" cy="20" r="8" />
          <circle cx="200" cy="20" r="4" strokeDasharray="2 4" />
        </g>
      </svg>
    </div>
  );
}
