"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
    children: ReactNode;
    className?: string;
};

export function ScrollGallery({ children, className = "" }: Props) {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div ref={constraintsRef} className={`relative overflow-hidden ${className}`}>
            <motion.div
                className="flex gap-5 overflow-x-auto no-scrollbar px-6 py-4"
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
                drag="x"
                dragConstraints={constraintsRef}
                dragElastic={0.08}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
            >
                {children}
            </motion.div>
        </div>
    );
}
