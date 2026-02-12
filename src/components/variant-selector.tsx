"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/cart/actions";

type Variant = {
    id: string;
    size: string;
    stock: number;
};

export default function VariantSelector({
    productId,
    variants,
}: {
    productId: string;
    variants: Variant[];
}) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selected = variants.find((v) => v.id === selectedId);
    const outOfStock = selected ? selected.stock <= 0 : false;

    function handleAddToCart() {
        if (!selectedId || outOfStock) return;

        startTransition(async () => {
            const result = await addToCart(productId, selectedId);
            if (result.error) {
                alert(result.error);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div>
                <div className="text-xs font-medium text-zinc-600 mb-2">Select Size</div>
                <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                        const isSelected = selectedId === v.id;
                        const isOutOfStock = v.stock <= 0;

                        return (
                            <button
                                key={v.id}
                                onClick={() => setSelectedId(v.id)}
                                disabled={isOutOfStock}
                                className={`h-10 min-w-[3rem] rounded-xl border px-4 text-sm font-medium transition
                                    ${isSelected
                                        ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                                        : isOutOfStock
                                            ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed line-through"
                                            : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400"
                                    }`}
                            >
                                {v.size}
                            </button>
                        );
                    })}
                </div>
            </div>

            {selected && (
                <div className="text-xs text-zinc-500">
                    {outOfStock
                        ? "This size is out of stock"
                        : `${selected.stock} in stock`}
                </div>
            )}

            <button
                onClick={handleAddToCart}
                disabled={!selectedId || outOfStock || isPending}
                className="h-11 w-full rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed md:w-56"
            >
                {!selectedId
                    ? "Select a Size"
                    : isPending
                        ? "Adding…"
                        : outOfStock
                            ? "Out of Stock"
                            : "Add to Cart"}
            </button>
        </div>
    );
}
