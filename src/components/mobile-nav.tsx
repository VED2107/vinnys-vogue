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

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

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

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/products", label: "Collections" },
        { href: "/about", label: "About" },
    ];

    const userLinks = isLoggedIn
        ? [
            { href: "/account/orders", label: "My Orders", count: 0 },
            { href: "/wishlist", label: "Wishlist", count: wishlistCount },
            { href: "/cart", label: "Cart", count: cartCount },
            ...(isAdmin ? [{ href: "/admin", label: "Admin", count: 0 }] : []),
        ]
        : [];

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex sm:hidden h-10 w-10 items-center justify-center text-neutral-500 transition-opacity hover:opacity-70"
                aria-label="Open menu"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
            </button>

            {open && (
                <div className="fixed inset-0 bg-[#F4EFE8] z-50 flex flex-col px-6 py-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-serif text-[16px] font-light text-heading tracking-[0.2em] uppercase">
                                Vinnys{" "}
                                <span className="font-serif italic font-normal text-[color:var(--gold)]">
                                    Vogue
                                </span>
                            </div>
                            <p className="text-[9px] tracking-[0.3em] uppercase text-neutral-500 mt-0.5">
                                Where Fashion Meets Elegance
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-xl font-light text-neutral-500 transition-opacity hover:opacity-70"
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>

                    <nav className="flex flex-col gap-0 mt-16">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`text-[20px] font-light tracking-wide py-4 border-b border-neutral-200 transition-opacity ${pathname === link.href
                                        ? "text-heading"
                                        : "text-neutral-600 hover:opacity-70"
                                    }`}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {userLinks.length > 0 && (
                        <div className="flex flex-col gap-0 mt-6">
                            {userLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center justify-between text-[16px] font-light tracking-wide text-neutral-600 py-3 transition-opacity hover:opacity-70"
                                >
                                    {link.label}
                                    {link.count > 0 && (
                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1C3A2A] px-1.5 text-[10px] font-medium text-white">
                                            {link.count > 99 ? "99+" : link.count}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto pt-6">
                        {isLoggedIn ? (
                            <form action="/logout" method="post">
                                <button className="w-full rounded-full bg-[#1C3A2A] px-5 py-3 text-[12px] tracking-[0.15em] uppercase font-light text-white transition-all duration-300 btn-luxury">
                                    Sign out
                                </button>
                            </form>
                        ) : (
                            <a href="/login" className="block w-full rounded-full bg-[#1C3A2A] px-5 py-3 text-center text-[12px] tracking-[0.15em] uppercase font-light text-white transition-all duration-300 btn-luxury">
                                Sign in
                            </a>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
