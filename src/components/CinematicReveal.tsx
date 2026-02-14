"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    children: React.ReactNode;
    delay?: number;
}

export default function CinematicReveal({ children, delay = 0 }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setVisible(true), delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`reveal ${visible ? "active" : ""}`}>
            {children}
        </div>
    );
}
