"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

interface CollectionSidebarProps {
    activeCategory: string | undefined;
}

export function CollectionSidebar({ activeCategory }: CollectionSidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-[220px] flex-shrink-0">
                <div className="sticky top-28">
                    <div className="text-[10px] font-semibold tracking-[0.3em] text-neutral-400 uppercase mb-6">
                        Categories
                    </div>
                    <nav className="space-y-0.5">
                        <a
                            href="/products"
                            className={`sidebar-link block px-3 py-2.5 text-[13px] transition-all rounded-lg ${!activeCategory
                                ? "sidebar-link-active"
                                : "text-neutral-500 hover:text-heading"
                                }`}
                        >
                            All Pieces
                        </a>
                        {PRODUCT_CATEGORIES.map((c) => (
                            <a
                                key={c.value}
                                href={`/products?category=${encodeURIComponent(c.value)}`}
                                className={`sidebar-link block px-3 py-2.5 text-[13px] transition-all rounded-lg ${activeCategory === c.value
                                    ? "sidebar-link-active"
                                    : "text-neutral-500 hover:text-heading"
                                    }`}
                            >
                                {c.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="md:hidden">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(0,0,0,0.08)] px-5 text-[13px] text-heading transition hover:border-[rgba(0,0,0,0.16)]"
                >
                    <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    {activeCategory
                        ? PRODUCT_CATEGORIES.find((c) => c.value === activeCategory)?.label ?? "Filter"
                        : "All Categories"}
                </button>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-bg-primary shadow-2xl"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.04)]">
                                <div className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">
                                    Categories
                                </div>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.04)] transition"
                                >
                                    <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <nav className="p-4 space-y-1">
                                <a
                                    href="/products"
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-4 py-3 text-[14px] rounded-xl transition ${!activeCategory
                                        ? "bg-accent text-white font-medium"
                                        : "text-neutral-600 hover:bg-[rgba(0,0,0,0.03)]"
                                        }`}
                                >
                                    All Pieces
                                </a>
                                {PRODUCT_CATEGORIES.map((c) => (
                                    <a
                                        key={c.value}
                                        href={`/products?category=${encodeURIComponent(c.value)}`}
                                        onClick={() => setMobileOpen(false)}
                                        className={`block px-4 py-3 text-[14px] rounded-xl transition ${activeCategory === c.value
                                            ? "bg-accent text-white font-medium"
                                            : "text-neutral-600 hover:bg-[rgba(0,0,0,0.03)]"
                                            }`}
                                    >
                                        {c.label}
                                    </a>
                                ))}
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
