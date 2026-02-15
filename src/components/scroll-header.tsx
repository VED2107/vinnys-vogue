"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollHeader({ children }: { children: React.ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const DELTA = 5;

        function onScroll() {
            const currentY = window.scrollY;
            const diff = currentY - lastScrollY.current;

            if (diff > DELTA && currentY > 88) {
                setHidden(true);
                lastScrollY.current = currentY;
            } else if (diff < -DELTA) {
                setHidden(false);
                lastScrollY.current = currentY;
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div
            className="sticky top-0 z-50 will-change-transform transition-transform duration-300"
            style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
        >
            {children}
        </div>
    );
}
