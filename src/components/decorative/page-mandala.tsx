/**
 * PageMandala — Lightweight centered mandala for non-homepage pages.
 * Decorative only: low opacity, behind content, pointer-events-none.
 * Use inside a `relative overflow-hidden` wrapper.
 *
 * ✅ Server component — zero JS shipped to client
 * ✅ Respects prefers-reduced-motion
 */
export function PageMandala({
    className = "",
}: {
    className?: string;
}) {
    const uid = "pm";

    return (
        <div
            className={`pointer-events-none absolute inset-0 z-0 flex items-center justify-center ${className}`}
            aria-hidden="true"
            style={{ animation: "fadeInSoft 2s cubic-bezier(0.22,1,0.36,1) forwards" }}
        >
            <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto animate-[spin_180s_linear_infinite] motion-reduce:animate-none"
                style={{ opacity: 0.5, willChange: "transform" }}
            >
                <defs>
                    <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C6A75E" />
                        <stop offset="50%" stopColor="#D4B96E" />
                        <stop offset="100%" stopColor="#E8D4A2" />
                    </linearGradient>
                </defs>

                <g stroke={`url(#${uid})`} fill="none">
                    <circle cx="250" cy="250" r="240" strokeWidth="1" strokeDasharray="8 6" />
                    <circle cx="250" cy="250" r="210" strokeWidth="1.2" />

                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                        <g key={a} transform={`rotate(${a} 250 250)`}>
                            <path d="M250 30 Q270 110 250 180 Q230 110 250 30Z" strokeWidth="1.2" />
                        </g>
                    ))}

                    <circle cx="250" cy="250" r="60" strokeWidth="1.2" />
                    <circle cx="250" cy="250" r="25" strokeWidth="1" />

                    {Array.from({ length: 12 }).map((_, i) => {
                        const rad = (i * 30 * Math.PI) / 180;
                        return (
                            <circle
                                key={i}
                                cx={250 + 75 * Math.cos(rad)}
                                cy={250 + 75 * Math.sin(rad)}
                                r="3"
                                fill={`url(#${uid})`}
                                fillOpacity="0.4"
                                stroke="none"
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
