"use client";

import { useTransition } from "react";
import {
    updateCartItemQuantity,
    removeCartItem,
} from "@/app/cart/actions";

export function CartItemControls({
    cartItemId,
    quantity,
}: {
    cartItemId: string;
    quantity: number;
}) {
    const [isPending, startTransition] = useTransition();

    function handleDecrement() {
        startTransition(async () => {
            if (quantity <= 1) {
                const result = await removeCartItem(cartItemId);
                if (result.error) alert(result.error);
            } else {
                const result = await updateCartItemQuantity(
                    cartItemId,
                    quantity - 1,
                );
                if (result.error) alert(result.error);
            }
        });
    }

    function handleIncrement() {
        startTransition(async () => {
            const result = await updateCartItemQuantity(
                cartItemId,
                quantity + 1,
            );
            if (result.error) alert(result.error);
        });
    }

    function handleRemove() {
        startTransition(async () => {
            const result = await removeCartItem(cartItemId);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-zinc-200">
                <button
                    onClick={handleDecrement}
                    disabled={isPending}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 items-center justify-center text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                    −
                </button>
                <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-zinc-900">
                    {quantity}
                </span>
                <button
                    onClick={handleIncrement}
                    disabled={isPending}
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 items-center justify-center text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                    +
                </button>
            </div>

            <button
                onClick={handleRemove}
                disabled={isPending}
                aria-label="Remove item"
                className="ml-1 text-xs text-zinc-400 underline transition hover:text-zinc-700 disabled:opacity-50"
            >
                Remove
            </button>
        </div>
    );
}
