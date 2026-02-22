"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

/**
 * Lightweight page wrapper.
 * - CSS-only fade-in animation (no framer-motion AnimatePresence)
 * - FlyToIconLayer lazy-loaded separately (only ships when user interacts)
 */

const FlyToIconLayer = dynamic(
    () => import("@/components/fly-to-icon").then((m) => ({ default: m.FlyToIconLayer })),
    { ssr: false }
);

export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <>
            <FlyToIconLayer />
            <div className="animate-fadeIn">
                {children}
            </div>
        </>
    );
}
