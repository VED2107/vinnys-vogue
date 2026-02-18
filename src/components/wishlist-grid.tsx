"use client";

import { useCallback, useState } from "react";
import { ProductCard } from "@/components/product-card";

type WishlistProduct = {
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl: string;
};

export function WishlistGrid({ products }: { products: WishlistProduct[] }) {
    const [removed, setRemoved] = useState<Set<string>>(new Set());

    const handleToggle = useCallback((productId: string, inWishlist: boolean) => {
        setRemoved((prev) => {
            const next = new Set(prev);
            if (!inWishlist) {
                next.add(productId);
            } else {
                next.delete(productId);
            }
            return next;
        });
    }, []);

    const visible = products.filter((p) => !removed.has(p.id));

    if (visible.length === 0 && products.length > 0) {
        return (
            <div className="mt-16 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-bg-card p-16 text-center">
                <div className="font-serif text-xl font-light text-heading">All items removed</div>
                <p className="mt-3 text-[15px] text-muted">Browse our collection and save pieces you love.</p>
                <a
                    href="/products"
                    className="mt-8 inline-flex items-center justify-center rounded-full border border-[#C6A75E] px-8 py-3 text-sm font-medium tracking-wide text-[#C6A75E] transition-all duration-300 hover:bg-[#C6A75E]/8 hover:-translate-y-0.5"
                >
                    Explore Collection
                </a>
            </div>
        );
    }

    return (
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 lg:gap-6">
            {visible.map((p) => (
                <ProductCard
                    key={p.id}
                    product={p}
                    imageUrl={p.imageUrl}
                    initialInWishlist={true}
                    onWishlistToggle={handleToggle}
                />
            ))}
        </div>
    );
}
