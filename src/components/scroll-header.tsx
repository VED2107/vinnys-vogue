"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollHeader({ children }: { children: React.ReactNode }) {
    const [hidden, setHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        function onScroll() {
            const currentY = window.scrollY;
            if (currentY > lastScrollY.current && currentY > 88) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            lastScrollY.current = currentY;
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
