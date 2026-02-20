"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Subtle gold mandala — thin stroke line art only.
 * Very low opacity (5–8%), large scale, centered behind section text.
 * Extremely slow rotation for a living, breathing feel.
 *
 * `variant` controls which geometric pattern is rendered
 * so each section gets a unique motif.
 */
export function GoldMandala({
  variant = 0,
  className = "",
}: {
  variant?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : undefined}
      transition={{ duration: 2.5, ease: EASE_LUXURY }}
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[450px] lg:max-w-[650px] h-auto animate-[spin_180s_linear_infinite]"
        aria-hidden="true"
        style={{ opacity: 0.12 }}
      >
        <defs>
          <linearGradient id={`gm-gold-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A75E" />
            <stop offset="100%" stopColor="#E8D4A2" />
          </linearGradient>
        </defs>

        <g stroke={`url(#gm-gold-${variant})`} strokeWidth="1.2">
          {/* Outer rings — scalloped */}
          <circle cx="250" cy="250" r="230" strokeDasharray="6 12" />
          <circle cx="250" cy="250" r="215" strokeDasharray="3 18" />
          <circle cx="250" cy="250" r="200" strokeDasharray="10 8" />

          {variant === 0 && (
            <>
              {/* Variant 0: Lotus mandala */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 250 250)`}>
                  {/* Petal */}
                  <path d="M250 50 Q265 120 250 170 Q235 120 250 50Z" />
                  {/* Inner arc */}
                  <path d="M250 100 Q260 140 250 165 Q240 140 250 100Z" />
                </g>
              ))}
              {/* Inner circle */}
              <circle cx="250" cy="250" r="45" />
              <circle cx="250" cy="250" r="30" strokeDasharray="4 8" />
              {/* 12 dots */}
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return (
                  <circle
                    key={i}
                    cx={250 + 60 * Math.cos(a)}
                    cy={250 + 60 * Math.sin(a)}
                    r="2"
                    fill={`url(#gm-gold-${variant})`}
                    stroke="none"
                  />
                );
              })}
            </>
          )}

          {variant === 1 && (
            <>
              {/* Variant 1: Star geometry */}
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 250 250)`}>
                  <line x1="250" y1="70" x2="250" y2="180" />
                  <path d="M240 90 L250 70 L260 90" />
                </g>
              ))}
              {/* Inner hexagon */}
              <polygon
                points="250,170 319,210 319,290 250,330 181,290 181,210"
                strokeDasharray="5 10"
              />
              <polygon
                points="250,190 299,215 299,285 250,310 201,285 201,215"
              />
              {/* Center */}
              <circle cx="250" cy="250" r="25" />
              {/* Dots at vertices */}
              {[0, 60, 120, 180, 240, 300].map((angle) => {
                const a = (angle * Math.PI) / 180;
                return (
                  <circle
                    key={angle}
                    cx={250 + 80 * Math.cos(a)}
                    cy={250 + 80 * Math.sin(a)}
                    r="2.5"
                    fill={`url(#gm-gold-${variant})`}
                    stroke="none"
                  />
                );
              })}
            </>
          )}

          {variant === 2 && (
            <>
              {/* Variant 2: Paisley-inspired arcs */}
              {[0, 90, 180, 270].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 250 250)`}>
                  <path d="M250 60 Q310 130 280 190 Q260 220 250 190 Q240 220 220 190 Q190 130 250 60Z" />
                  <path d="M250 90 Q290 140 270 180 Q258 200 250 180 Q242 200 230 180 Q210 140 250 90Z" />
                </g>
              ))}
              {/* Inner diamond */}
              <path d="M250 180 L320 250 L250 320 L180 250Z" strokeDasharray="6 8" />
              <circle cx="250" cy="250" r="35" />
              {/* 8 small dots */}
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i * 45 * Math.PI) / 180;
                return (
                  <circle
                    key={i}
                    cx={250 + 50 * Math.cos(a)}
                    cy={250 + 50 * Math.sin(a)}
                    r="1.8"
                    fill={`url(#gm-gold-${variant})`}
                    stroke="none"
                  />
                );
              })}
            </>
          )}
        </g>
      </svg>
    </motion.div>
  );
}
