"use client";

import { useEffect, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Global event bus for badge count changes
// ---------------------------------------------------------------------------

type BadgeEvent = {
    type: "cart" | "wishlist";
    delta: number; // +1 for add, -1 for remove
};

const badgeListeners = new Set<(e: BadgeEvent) => void>();

/** Call this from any client component to update header badges instantly. */
export function emitBadgeUpdate(type: "cart" | "wishlist", delta: number) {
    const event: BadgeEvent = { type, delta };
    badgeListeners.forEach((fn) => fn(event));
}

// ---------------------------------------------------------------------------
// Hook: subscribe to badge count changes
// ---------------------------------------------------------------------------

export function useBadgeCount(type: "cart" | "wishlist", initialCount: number) {
    const [count, setCount] = useState(initialCount);

    const handler = useCallback(
        (e: BadgeEvent) => {
            if (e.type === type) {
                setCount((prev) => Math.max(0, prev + e.delta));
            }
        },
        [type],
    );

    useEffect(() => {
        badgeListeners.add(handler);
        return () => {
            badgeListeners.delete(handler);
        };
    }, [handler]);

    // Sync if server re-renders with a different initial count
    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    return count;
}

// ---------------------------------------------------------------------------
// Badge component for header icons
// ---------------------------------------------------------------------------

export function HeaderBadge({
    type,
    initialCount,
}: {
    type: "cart" | "wishlist";
    initialCount: number;
}) {
    const count = useBadgeCount(type, initialCount);

    if (count <= 0) return null;

    return (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1C3A2A] px-1 text-[9px] font-medium text-white">
            {count > 99 ? "99+" : count}
        </span>
    );
}
