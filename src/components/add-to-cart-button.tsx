"use client";

import { useState, useTransition, useRef, useEffect } from "react";

export default function AddToCartButton({
    onClick,
    disabled,
}: {
    onClick: () => Promise<void>;
    disabled: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    function handleClick() {
        setError(null);
        startTransition(async () => {
            try {
                await onClick();
                setAdded(true);
                timeoutRef.current = setTimeout(() => setAdded(false), 2000);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add to cart");
            }
        });
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleClick}
                disabled={disabled || isPending}
                className="h-12 w-full rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover-lift hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                {isPending
                    ? "Adding…"
                    : added
                        ? "Added ✓"
                        : disabled
                            ? "Out of Stock"
                            : "Add to Cart"}
            </button>
            {error ? <div className="text-[13px] text-red-700">{error}</div> : null}
        </div>
    );
}
