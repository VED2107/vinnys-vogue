"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type FlyItem = {
    id: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    imageUrl?: string;
    icon: "cart" | "wishlist";
};

let _flyId = 0;
const listeners = new Set<(item: FlyItem) => void>();

/**
 * Trigger a fly-to-icon animation.
 * @param origin - The source element (button) or a DOMRect / { x, y }
 * @param icon - "cart" or "wishlist"
 * @param imageUrl - Optional product image to show in the flying dot
 */
export function triggerFlyToIcon(
    origin: HTMLElement | DOMRect | { x: number; y: number },
    icon: "cart" | "wishlist",
    imageUrl?: string,
) {
    const targetId =
        icon === "cart" ? "header-cart-icon" : "header-wishlist-icon";
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return; // header icon not found (e.g. user not logged in)

    const targetRect = targetEl.getBoundingClientRect();
    let originX: number;
    let originY: number;

    if (origin instanceof HTMLElement) {
        const r = origin.getBoundingClientRect();
        originX = r.left + r.width / 2;
        originY = r.top + r.height / 2;
    } else if ("width" in origin) {
        // DOMRect
        originX = (origin as DOMRect).left + (origin as DOMRect).width / 2;
        originY = (origin as DOMRect).top + (origin as DOMRect).height / 2;
    } else {
        originX = origin.x;
        originY = origin.y;
    }

    const item: FlyItem = {
        id: ++_flyId,
        x: originX,
        y: originY,
        targetX: targetRect.left + targetRect.width / 2,
        targetY: targetRect.top + targetRect.height / 2,
        imageUrl,
        icon,
    };

    listeners.forEach((fn) => fn(item));
}

/** Mount this once in a layout — it renders flying thumbnails via a portal. */
export function FlyToIconLayer() {
    const [items, setItems] = useState<FlyItem[]>([]);

    useEffect(() => {
        const add = (item: FlyItem) =>
            setItems((prev) => [...prev, item]);
        listeners.add(add);
        return () => {
            listeners.delete(add);
        };
    }, []);

    const remove = (id: number) =>
        setItems((prev) => prev.filter((i) => i.id !== id));

    if (typeof window === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {items.map((item) => {
                const dx = item.targetX - item.x;
                const dy = item.targetY - item.y;

                return (
                    <motion.div
                        key={item.id}
                        initial={{
                            position: "fixed",
                            left: item.x - 26,
                            top: item.y - 26,
                            width: 52,
                            height: 52,
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            zIndex: 99999,
                            pointerEvents: "none" as const,
                        }}
                        animate={{
                            x: [0, dx * 0.3, dx],
                            y: [0, Math.min(dy * 0.4, -60), dy],
                            scale: [1, 0.85, 0.35],
                            opacity: [1, 0.95, 0.7],
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 0.7,
                            ease: [0.32, 0, 0.15, 1],
                            times: [0, 0.4, 1],
                        }}
                        onAnimationComplete={() => {
                            remove(item.id);
                            // Pulse the target icon
                            const targetId =
                                item.icon === "cart"
                                    ? "header-cart-icon"
                                    : "header-wishlist-icon";
                            const el = document.getElementById(targetId);
                            if (el) {
                                el.classList.add("animate-bounce-once");
                                setTimeout(() => el.classList.remove("animate-bounce-once"), 500);
                            }
                        }}
                        className="rounded-full overflow-hidden shadow-xl border-2 border-gold/50"
                        style={{
                            boxShadow: "0 4px 24px rgba(198, 167, 86, 0.35), 0 0 12px rgba(198, 167, 86, 0.2)",
                            background: item.imageUrl
                                ? `url(${item.imageUrl}) center/cover no-repeat`
                                : item.icon === "wishlist"
                                    ? "linear-gradient(135deg, #C6A75E, #E8D4A2)"
                                    : "linear-gradient(135deg, #1C3A2A, #2D5640)",
                        }}
                    >
                        {/* If no image, show a small icon */}
                        {!item.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center text-white">
                                {item.icon === "wishlist" ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="white"
                                        stroke="none"
                                    >
                                        <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l3 3L12 21l5.8-7.6 3-3c1.6-1.6 1.6-4.2 0-5.8Z" />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                        <line x1="3" x2="21" y1="6" y2="6" />
                                        <path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                )}
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </AnimatePresence>,
        document.body,
    );
}
