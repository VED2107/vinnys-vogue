"use client";

import { useState } from "react";
import { addToCart, buyNow } from "@/app/cart/actions";
import AddToCartButton from "@/components/add-to-cart-button";

type Variant = { id: string; size: string; stock: number };

export default function VariantSelector({
    productId,
    variants,
    productStock = 0,
}: {
    productId: string;
    variants: Variant[];
    productStock?: number;
}) {
    const [selectedId, setSelectedId] = useState<string | null>(
        variants.length > 0 ? variants[0].id : null,
    );

    const selected = variants.find((v) => v.id === selectedId) ?? null;
    const outOfStock = selected ? selected.stock <= 0 : true;

    async function handleAddToCart() {
        if (!selectedId) return;
        const result = await addToCart(productId, selectedId);
        if (result?.error) throw new Error(result.error);
    }

    async function handleBuyNow() {
        if (!selectedId) return;
        await buyNow(productId, selectedId);
    }

    if (variants.length === 0) {
        return (
            <div className="space-y-4">
                <AddToCartButton
                    onAddToCart={async () => {
                        const result = await addToCart(productId);
                        if (result?.error) throw new Error(result.error);
                    }}
                    onBuyNow={async () => {
                        await buyNow(productId);
                    }}
                    disabled={productStock <= 0}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
                    Size
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setSelectedId(v.id)}
                            disabled={v.stock <= 0}
                            className={`h-10 rounded-full px-5 text-[14px] transition-colors duration-200 ${v.id === selectedId
                                ? "bg-accent text-white font-medium"
                                : v.stock > 0
                                    ? "border border-[rgba(0,0,0,0.1)] text-heading hover:border-[rgba(0,0,0,0.2)]"
                                    : "border border-[rgba(0,0,0,0.04)] text-[rgba(0,0,0,0.2)] cursor-not-allowed"
                                }`}
                        >
                            {v.size}
                        </button>
                    ))}
                </div>
                {selected && selected.stock > 0 && selected.stock < 5 ? (
                    <div className="mt-3 text-[13px] text-gold">
                        Only {selected.stock} left in stock
                    </div>
                ) : null}
            </div>

            <AddToCartButton
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                disabled={outOfStock}
            />
        </div>
    );
}
