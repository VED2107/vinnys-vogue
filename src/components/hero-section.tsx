"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { MOTION } from "@/lib/motion-config";

/* ——— Staggered Hero Container ——— */
function HeroReveal({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-30px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: MOTION.stagger,
                        delayChildren: 0.1,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ——— Individual hero child with cinematic reveal ——— */
function HeroItem({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: MOTION.enter.y },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: MOTION.duration.slow,
                        ease: MOTION.ease,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export { HeroReveal, HeroItem };
