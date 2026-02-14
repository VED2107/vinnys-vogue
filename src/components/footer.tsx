export function Footer() {
    return (
        <footer className="border-t border-[rgba(0,0,0,0.06)]">
            <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="font-serif text-xl font-light text-heading tracking-[-0.02em]">
                            Vinnys <span className="text-gold italic">Vogue</span>
                        </div>
                        <p className="mt-3 text-[13px] leading-[1.6] text-muted">
                            Luxury Indian couture for your most treasured moments.
                        </p>
                        <div className="mt-5 flex gap-3">
                            <a
                                href="https://www.instagram.com/vinnys_vogue_"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-muted transition hover:border-gold hover:text-gold"
                                aria-label="Instagram"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <circle cx="12" cy="12" r="5" />
                                    <circle
                                        cx="17.5"
                                        cy="6.5"
                                        r="1.5"
                                        fill="currentColor"
                                        stroke="none"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <div className="text-[13px] font-semibold tracking-[0.05em] text-heading uppercase">
                            Shop
                        </div>
                        <ul className="mt-4 space-y-3 text-[14px] text-muted">
                            <li>
                                <a
                                    href="/products?category=bridal"
                                    className="transition hover:text-heading"
                                >
                                    Bridal Collection
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/products?category=festive"
                                    className="transition hover:text-heading"
                                >
                                    Festive Wear
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/products?category=reception"
                                    className="transition hover:text-heading"
                                >
                                    Reception Ensembles
                                </a>
                            </li>
                            <li>
                                <a href="/products" className="transition hover:text-heading">
                                    All Collections
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-[13px] font-semibold tracking-[0.05em] text-heading uppercase">
                            Customer Care
                        </div>
                        <ul className="mt-4 space-y-3 text-[14px] text-muted">
                            <li>
                                <a
                                    href="tel:+916262999986"
                                    className="transition hover:text-heading"
                                >
                                    +91 62629 99986
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.instagram.com/vinnys_vogue_"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="transition hover:text-heading"
                                >
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/shipping-returns"
                                    className="transition hover:text-heading"
                                >
                                    Shipping &amp; Returns
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/size-guide"
                                    className="transition hover:text-heading"
                                >
                                    Size Guide
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-[13px] font-semibold tracking-[0.05em] text-heading uppercase">
                            About
                        </div>
                        <ul className="mt-4 space-y-3 text-[14px] text-muted">
                            <li>
                                <a href="/about" className="transition hover:text-heading">
                                    Our Story
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/#craftsmanship"
                                    className="transition hover:text-heading"
                                >
                                    Craftsmanship
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/sustainability"
                                    className="transition hover:text-heading"
                                >
                                    Sustainability
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-[rgba(0,0,0,0.06)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[13px] text-muted">
                        © 2026 Vinnys Vogue. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-[13px] text-muted">
                        <a
                            href="/privacy-policy"
                            className="transition hover:text-heading"
                        >
                            Privacy Policy
                        </a>
                        <a
                            href="/terms-of-service"
                            className="transition hover:text-heading"
                        >
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
