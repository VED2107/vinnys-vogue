"use client";

import { useTransition } from "react";
import { addToCart } from "@/app/cart/actions";

export function AddToCartButton({ productId, variantId }: { productId: string; variantId?: string }) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            const result = await addToCart(productId, variantId);
            if (result.error) {
                // Basic alert — can be upgraded to a toast later
                alert(result.error);
            }
        });
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50 md:w-56"
        >
            {isPending ? "Adding…" : "Add to Cart"}
        </button>
    );
}
