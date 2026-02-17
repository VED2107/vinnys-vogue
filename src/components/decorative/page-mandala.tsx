"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE_LUXURY: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * PageMandala — Lightweight centered mandala for non-homepage pages.
 * Decorative only: low opacity, behind content, pointer-events-none.
 * Use inside a `relative overflow-hidden` wrapper.
 */
export function PageMandala({
    size = "md",
    className = "",
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "100px" });

    const sizeMap = {
        sm: "h-[350px] w-[350px] sm:h-[400px] sm:w-[400px]",
        md: "h-[450px] w-[450px] sm:h-[550px] sm:w-[550px]",
        lg: "h-[550px] w-[550px] sm:h-[650px] sm:w-[650px]",
    };

    const uid = `pm-${size}`;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : undefined}
            transition={{ duration: 2, ease: EASE_LUXURY }}
            className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 ${className}`}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`${sizeMap[size]} animate-[spin_180s_linear_infinite] opacity-[0.35]`}
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
        </motion.div>
    );
}
