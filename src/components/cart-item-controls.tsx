"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCartItemQuantity, removeCartItem } from "@/app/cart/actions";
import { emitBadgeUpdate } from "@/components/header-badge";

export default function CartItemControls({
    cartItemId,
    currentQty,
    availableStock,
}: {
    cartItemId: string;
    currentQty: number;
    availableStock: number;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const atStockLimit = availableStock > 0 && currentQty >= availableStock;

    function handleQty(delta: number) {
        setError(null);
        startTransition(async () => {
            try {
                await updateCartItemQuantity(cartItemId, currentQty + delta);
                emitBadgeUpdate("cart", delta);
                router.refresh();
            } catch (err) {
                setError("Failed to update quantity.");
            }
        });
    }

    function handleRemove() {
        setError(null);
        startTransition(async () => {
            try {
                await removeCartItem(cartItemId);
                emitBadgeUpdate("cart", -currentQty);
                router.refresh();
            } catch (err) {
                setError("Failed to remove item.");
            }
        });
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-border/50">
                    <button
                        disabled={isPending || currentQty <= 1}
                        onClick={() => handleQty(-1)}
                        className="flex h-7 w-7 items-center justify-center rounded-l-full text-text-secondary transition hover:text-text-primary disabled:opacity-25"
                    >
                        −
                    </button>
                    <span className="min-w-[24px] text-center text-[13px] font-medium text-text-primary">
                        {currentQty}
                    </span>
                    <button
                        disabled={isPending || atStockLimit}
                        onClick={() => handleQty(1)}
                        className="flex h-7 w-7 items-center justify-center rounded-r-full text-text-secondary transition hover:text-text-primary disabled:opacity-25"
                    >
                        +
                    </button>
                </div>
                <button
                    disabled={isPending}
                    onClick={handleRemove}
                    className="text-[11px] font-light text-text-secondary transition hover:text-gold disabled:opacity-25"
                >
                    Remove
                </button>
            </div>
            {atStockLimit && (
                <div className="text-[12px] text-gold">Only {availableStock} available</div>
            )}
            {error ? <div className="text-[12px] text-red-600">{error}</div> : null}
        </div>
    );
}
