"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * MandalaBackground — Gold mandala, spinning slowly.
 * Place inside a `relative overflow-hidden` container.
 * Responsive: 300px mobile → 500px tablet → 700px desktop.
 */
export function MandalaBackground({
  variant = "lotus",
  position = "top-right",
  className = "",
  opacity,
}: {
  variant?: "lotus" | "geometric";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
  className?: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });

  // Tailwind position classes — places the wrapper at the right spot
  const posMap: Record<string, string> = {
    "top-right": "top-0 right-0 -translate-y-1/4 translate-x-1/4",
    "top-left": "top-0 left-0 -translate-y-1/4 -translate-x-1/4",
    "bottom-right": "bottom-0 right-0 translate-y-1/4 translate-x-1/4",
    "bottom-left": "bottom-0 left-0 translate-y-1/4 -translate-x-1/4",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const uid = `mb-${variant}-${position}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration: 2, ease: EASE_LUXURY }}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Positioning wrapper — translate offsets, stays still */}
      <div className={`absolute ${posMap[position]} w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] lg:w-[700px] lg:h-[700px]`}>
        {/* SVG — only spins */}
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full animate-[spin_180s_linear_infinite]"
          style={{ opacity: opacity ?? 0.45 }}
        >
          <defs>
            <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C6A75E" />
              <stop offset="50%" stopColor="#D4B96E" />
              <stop offset="100%" stopColor="#E8D4A2" />
            </linearGradient>
          </defs>

          {variant === "lotus" ? (
            <g stroke={`url(#${uid})`} fill="none">
              {/* Outer decorative rings */}
              <circle cx="250" cy="250" r="240" strokeWidth="1" strokeDasharray="8 6" />
              <circle cx="250" cy="250" r="225" strokeWidth="0.8" strokeDasharray="3 10" />
              <circle cx="250" cy="250" r="210" strokeWidth="1.2" />
              <circle cx="250" cy="250" r="195" strokeWidth="0.6" strokeDasharray="12 4" />

              {/* 8 large lotus petals */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <g key={a} transform={`rotate(${a} 250 250)`}>
                  <path d="M250 30 Q270 110 250 180 Q230 110 250 30Z" strokeWidth="1.2" />
                  <path d="M250 70 Q262 130 250 170 Q238 130 250 70Z" strokeWidth="0.8" fill={`url(#${uid})`} fillOpacity="0.04" />
                </g>
              ))}

              {/* 8 smaller inner petals offset by 22.5° */}
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((a) => (
                <g key={a} transform={`rotate(${a} 250 250)`}>
                  <path d="M250 120 Q258 160 250 190 Q242 160 250 120Z" strokeWidth="0.8" />
                </g>
              ))}

              {/* Inner ring details */}
              <circle cx="250" cy="250" r="60" strokeWidth="1.2" />
              <circle cx="250" cy="250" r="45" strokeWidth="0.8" strokeDasharray="5 5" />
              <circle cx="250" cy="250" r="25" strokeWidth="1" />

              {/* 16 dots around inner ring */}
              {Array.from({ length: 16 }).map((_, i) => {
                const rad = (i * 22.5 * Math.PI) / 180;
                return (
                  <circle
                    key={i}
                    cx={250 + 75 * Math.cos(rad)}
                    cy={250 + 75 * Math.sin(rad)}
                    r="3"
                    fill={`url(#${uid})`}
                    fillOpacity="0.5"
                    stroke="none"
                  />
                );
              })}

              {/* 8 dots at petal tips */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
                const rad = (a * Math.PI) / 180;
                return (
                  <circle
                    key={a}
                    cx={250 + 195 * Math.cos(rad - Math.PI / 2)}
                    cy={250 + 195 * Math.sin(rad - Math.PI / 2)}
                    r="4"
                    fill={`url(#${uid})`}
                    fillOpacity="0.3"
                    stroke="none"
                  />
                );
              })}
            </g>
          ) : (
            <g stroke={`url(#${uid})`} fill="none">
              {/* Concentric rings with varied weight */}
              <circle cx="250" cy="250" r="240" strokeWidth="1" strokeDasharray="6 8" />
              <circle cx="250" cy="250" r="220" strokeWidth="1.2" />
              <circle cx="250" cy="250" r="195" strokeWidth="0.8" strokeDasharray="10 5" />
              <circle cx="250" cy="250" r="170" strokeWidth="1" />
              <circle cx="250" cy="250" r="145" strokeWidth="0.6" strokeDasharray="4 8" />
              <circle cx="250" cy="250" r="120" strokeWidth="1.2" />

              {/* 6 primary spokes with arrowheads */}
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <g key={a} transform={`rotate(${a} 250 250)`}>
                  <line x1="250" y1="30" x2="250" y2="130" strokeWidth="1.2" />
                  <path d="M242 60 L250 35 L258 60" strokeWidth="1" />
                  <line x1="250" y1="130" x2="250" y2="170" strokeWidth="0.6" strokeDasharray="3 4" />
                </g>
              ))}

              {/* 6 secondary spokes */}
              {[30, 90, 150, 210, 270, 330].map((a) => (
                <g key={a} transform={`rotate(${a} 250 250)`}>
                  <line x1="250" y1="60" x2="250" y2="145" strokeWidth="0.8" strokeDasharray="6 4" />
                </g>
              ))}

              {/* Inner hexagon — filled with very low opacity */}
              <polygon
                points="250,155 332,202 332,298 250,345 168,298 168,202"
                strokeWidth="1.2"
                fill={`url(#${uid})`}
                fillOpacity="0.025"
              />
              <polygon
                points="250,180 307,215 307,285 250,320 193,285 193,215"
                strokeWidth="0.8"
                strokeDasharray="6 6"
              />

              {/* Center circles */}
              <circle cx="250" cy="250" r="55" strokeWidth="1.2" />
              <circle cx="250" cy="250" r="35" strokeWidth="0.8" strokeDasharray="4 4" />
              <circle cx="250" cy="250" r="18" strokeWidth="1" />

              {/* 12 dots around center */}
              {Array.from({ length: 12 }).map((_, i) => {
                const rad = (i * 30 * Math.PI) / 180;
                return (
                  <circle
                    key={i}
                    cx={250 + 90 * Math.cos(rad)}
                    cy={250 + 90 * Math.sin(rad)}
                    r="3.5"
                    fill={`url(#${uid})`}
                    fillOpacity="0.4"
                    stroke="none"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </motion.div>
  );
}
