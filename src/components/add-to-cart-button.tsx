"use client";

import { useState, useTransition, useRef, useEffect } from "react";

function Spinner() {
    return (
        <svg className="inline-block h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

export default function AddToCartButton({
    onAddToCart,
    onBuyNow,
    disabled,
}: {
    onAddToCart: () => Promise<void>;
    onBuyNow?: () => Promise<void>;
    disabled: boolean;
}) {
    const [cartPending, startCartTransition] = useTransition();
    const [buyPending, startBuyTransition] = useTransition();
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const anyPending = cartPending || buyPending;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    function handleAddToCart() {
        setError(null);
        startCartTransition(async () => {
            try {
                await onAddToCart();
                setAdded(true);
                timeoutRef.current = setTimeout(() => setAdded(false), 2000);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add to cart");
            }
        });
    }

    function handleBuyNow() {
        if (!onBuyNow) return;
        setError(null);
        startBuyTransition(async () => {
            try {
                await onBuyNow();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            }
        });
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={handleAddToCart}
                    disabled={disabled || anyPending}
                    className="h-12 flex-1 rounded-full bg-accent text-[14px] font-medium tracking-wide text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    {cartPending ? (
                        <><Spinner /> Adding…</>
                    ) : added ? (
                        "Added ✓"
                    ) : disabled ? (
                        "Out of Stock"
                    ) : (
                        "Add to Cart"
                    )}
                </button>
                {onBuyNow && !disabled && (
                    <button
                        onClick={handleBuyNow}
                        disabled={anyPending}
                        className="h-12 rounded-full border border-gold px-6 text-[14px] font-medium tracking-wide text-gold hover:bg-gold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        {buyPending ? (
                            <><Spinner /> Buying…</>
                        ) : (
                            "Buy Now"
                        )}
                    </button>
                )}
            </div>
            {error ? <div className="text-[13px] text-red-700">{error}</div> : null}
        </div>
    );
}
