"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface MobileNavProps {
    isLoggedIn: boolean;
    isAdmin: boolean;
    cartCount: number;
    wishlistCount: number;
}

export function MobileNav({ isLoggedIn, isAdmin, cartCount, wishlistCount }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    return (
        <>
            {/* Hamburger button — visible only on mobile */}
            <button
                onClick={() => setOpen(true)}
                className="flex sm:hidden h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-muted transition hover:border-gold hover:text-gold"
                aria-label="Open menu"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Drawer — slides from right */}
            <div
                className={`fixed top-0 right-0 z-[70] h-full w-[280px] bg-bg-primary shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${open ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Close button */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.06)]">
                    <div className="font-serif text-lg font-light text-heading tracking-[-0.02em]">
                        Vinnys <span className="text-gold italic">Vogue</span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-muted transition hover:border-gold hover:text-gold"
                        aria-label="Close menu"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Nav links */}
                <nav className="px-6 py-6 space-y-1">
                    {[
                        { href: "/", label: "Home" },
                        { href: "/products", label: "Collections" },
                        { href: "/about", label: "About" },
                    ].map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`block rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${pathname === link.href
                                    ? "bg-accent/5 text-heading"
                                    : "text-muted hover:text-heading hover:bg-accent/5"
                                }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="mx-6 h-px bg-[rgba(0,0,0,0.06)]" />

                {/* User actions */}
                <div className="px-6 py-6 space-y-1">
                    {isLoggedIn ? (
                        <>
                            <a
                                href="/account/orders"
                                className="block rounded-xl px-4 py-3 text-[15px] font-medium text-muted transition hover:text-heading hover:bg-accent/5"
                            >
                                My Orders
                            </a>
                            <a
                                href="/wishlist"
                                className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium text-muted transition hover:text-heading hover:bg-accent/5"
                            >
                                Wishlist
                                {wishlistCount > 0 && (
                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium text-white">
                                        {wishlistCount > 99 ? "99+" : wishlistCount}
                                    </span>
                                )}
                            </a>
                            <a
                                href="/cart"
                                className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium text-muted transition hover:text-heading hover:bg-accent/5"
                            >
                                Cart
                                {cartCount > 0 && (
                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium text-white">
                                        {cartCount > 99 ? "99+" : cartCount}
                                    </span>
                                )}
                            </a>
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="block rounded-xl px-4 py-3 text-[15px] font-medium text-muted transition hover:text-heading hover:bg-accent/5"
                                >
                                    Admin
                                </a>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Bottom action */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-[rgba(0,0,0,0.06)]">
                    {isLoggedIn ? (
                        <form action="/logout" method="post">
                            <button className="w-full rounded-full bg-accent px-5 py-3 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover">
                                Sign out
                            </button>
                        </form>
                    ) : (
                        <a
                            href="/login"
                            className="block w-full rounded-full bg-accent px-5 py-3 text-center text-[14px] font-medium text-white hover-lift hover:bg-accent-hover"
                        >
                            Sign in
                        </a>
                    )}
                </div>
            </div>
        </>
    );
}
