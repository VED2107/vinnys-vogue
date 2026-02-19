"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TRANSITION = {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
};

/**
 * Cinematic page transition with AnimatePresence.
 *
 * - Exit animation completes before new page enters (mode="wait")
 * - Fade + subtle Y-shift for luxury feel
 * - pathname as key ensures each route gets its own animation lifecycle
 */
export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={TRANSITION}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
