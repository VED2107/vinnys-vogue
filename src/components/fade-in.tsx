"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { MOTION } from "@/lib/motion-config";

type Props = {
    children: ReactNode;
    className?: string;
    delay?: number;
};

export function FadeIn({ children, className = "", delay = 0 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-30px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: MOTION.enter.y }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: MOTION.enter.y }}
            transition={{
                duration: MOTION.duration.slow,
                delay,
                ease: MOTION.ease,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Wraps a grid of children and staggers their entrance.
 */
export function StaggerGrid({
    children,
    className = "",
    stagger = MOTION.stagger,
}: {
    children: ReactNode;
    className?: string;
    stagger?: number;
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
                visible: { transition: { staggerChildren: stagger } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
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
                        duration: MOTION.duration.normal,
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
