"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NAV_SECTIONS, TAB_ITEMS } from "./nav-config";

export function AdminSidebar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    // Lock body scroll
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    const desktopSidebar = (
        <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col border-r border-[rgba(0,0,0,0.06)] bg-white/60 backdrop-blur-sm">
            {/* Header */}
            <div className="px-7 pt-8 pb-6">
                <div className="gold-divider mb-3" />
                <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Dashboard</div>
                <h1 className="mt-1 font-serif text-[24px] font-light tracking-[-0.02em] text-heading">Admin</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 pb-8 space-y-6">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <div className="px-3 mb-2 text-[11px] font-medium tracking-[0.2em] text-neutral-400 uppercase">
                            {section.label}
                        </div>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/admin" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`block rounded-xl px-3 py-2.5 text-[14px] transition-all duration-200 ${isActive
                                            ? "bg-[#0F2E22]/[0.06] text-heading font-medium"
                                            : "text-neutral-500 hover:bg-[rgba(0,0,0,0.03)] hover:text-heading"
                                            }`}
                                    >
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-[rgba(0,0,0,0.06)]">
                <form action="/logout" method="post">
                    <button className="w-full text-left rounded-xl px-3 py-2.5 text-[14px] text-neutral-500 transition hover:bg-[rgba(0,0,0,0.03)] hover:text-heading">
                        Sign out
                    </button>
                </form>
            </div>
        </aside>
    );

    const isTabActive = (href: string) =>
        pathname === href || (href !== "/admin" && pathname.startsWith(href));

    return (
        <>
            {desktopSidebar}

            {/* ═══ MOBILE BOTTOM TAB BAR ═══ */}
            <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
                <div className="admin-bottom-bar">
                    {TAB_ITEMS.map((tab) => {
                        const active = isTabActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`admin-tab-item ${active ? "admin-tab-active" : ""}`}
                            >
                                <span className={`admin-tab-icon ${active ? "admin-tab-icon-active" : ""}`}>
                                    {tab.icon}
                                </span>
                                <span className="admin-tab-label">{tab.title}</span>
                            </Link>
                        );
                    })}

                    {/* Menu button */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className={`admin-tab-item ${menuOpen ? "admin-tab-active" : ""}`}
                    >
                        <span className={`admin-tab-icon ${menuOpen ? "admin-tab-icon-active" : ""}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="19" r="1" />
                            </svg>
                        </span>
                        <span className="admin-tab-label">More</span>
                    </button>
                </div>
            </div>

            {/* ═══ FULL-SCREEN MENU OVERLAY ═══ */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 md:hidden admin-overlay-enter">
                    {/* Frosted backdrop */}
                    <div
                        className="absolute inset-0 bg-[#F4EFE8]/80 backdrop-blur-xl"
                        onClick={() => setMenuOpen(false)}
                    />

                    {/* Menu content */}
                    <div className="relative z-10 flex flex-col h-full admin-menu-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-[env(safe-area-inset-top,16px)] pb-4" style={{ paddingTop: "max(env(safe-area-inset-top), 20px)" }}>
                            <div>
                                <div className="text-[10px] font-semibold tracking-[0.3em] text-gold uppercase">Vinnys Vogue</div>
                                <div className="mt-0.5 font-serif text-[20px] font-light text-heading">Admin Menu</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMenuOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm text-neutral-500 transition active:scale-90"
                                aria-label="Close"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#C6A756]/40 to-transparent" />

                        {/* Navigation grid */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                            {NAV_SECTIONS.map((section, sIdx) => (
                                <div key={section.label} className="admin-menu-section" style={{ animationDelay: `${sIdx * 60 + 100}ms` }}>
                                    <div className="px-1 mb-3 text-[10px] font-semibold tracking-[0.25em] text-neutral-400 uppercase">
                                        {section.label}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {section.items.map((item) => {
                                            const isActive =
                                                pathname === item.href ||
                                                (item.href !== "/admin" && pathname.startsWith(item.href));
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`admin-menu-card ${isActive ? "admin-menu-card-active" : ""}`}
                                                >
                                                    <span className="admin-menu-card-title">{item.title}</span>
                                                    <svg className="admin-menu-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom actions */}
                        <div className="px-6 pb-8 pt-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent mb-4" />
                            <form action="/logout" method="post">
                                <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/50 backdrop-blur-sm border border-[rgba(0,0,0,0.06)] px-5 py-3.5 text-[14px] text-neutral-500 transition active:scale-[0.98] hover:text-heading">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
