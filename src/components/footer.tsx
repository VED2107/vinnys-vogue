export function Footer() {
    return (
        <footer className="w-full bg-[#F4EFE8] border-t border-neutral-200">
            <div className="px-6 lg:px-16 xl:px-24 py-24">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="font-serif text-[16px] font-light text-heading tracking-[0.2em] uppercase">
                            Vinnys Vogue
                        </div>
                        <p className="mt-2 text-[13px] leading-[1.6] text-neutral-500">
                            Luxury Indian couture for your most treasured moments.
                        </p>
                        <div className="mt-4 flex gap-3">
                            <a
                                href="https://www.instagram.com/vinnys_vogue_"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-400 transition-opacity hover:opacity-70"
                                aria-label="Instagram"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <circle cx="12" cy="12" r="5" />
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <div className="text-[11px] tracking-[0.25em] uppercase font-medium text-neutral-400 mb-4">
                            Shop
                        </div>
                        <ul className="space-y-2.5 text-[13px] text-neutral-600">
                            <li><a href="/products?category=bridal" className="transition-opacity hover:opacity-70">Bridal Collection</a></li>
                            <li><a href="/products?category=festive" className="transition-opacity hover:opacity-70">Festive Wear</a></li>
                            <li><a href="/products?category=reception" className="transition-opacity hover:opacity-70">Reception Ensembles</a></li>
                            <li><a href="/products" className="transition-opacity hover:opacity-70">All Collections</a></li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-[11px] tracking-[0.25em] uppercase font-medium text-neutral-400 mb-4">
                            Customer Care
                        </div>
                        <ul className="space-y-2.5 text-[13px] text-neutral-600">
                            <li><a href="tel:+916262999986" className="transition-opacity hover:opacity-70">+91 62629 99986</a></li>
                            <li><a href="https://www.instagram.com/vinnys_vogue_" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-70">Instagram</a></li>
                            <li><a href="/shipping-returns" className="transition-opacity hover:opacity-70">Shipping &amp; Returns</a></li>
                            <li><a href="/size-guide" className="transition-opacity hover:opacity-70">Size Guide</a></li>
                        </ul>
                    </div>

                    <div>
                        <div className="text-[11px] tracking-[0.25em] uppercase font-medium text-neutral-400 mb-4">
                            About
                        </div>
                        <ul className="space-y-2.5 text-[13px] text-neutral-600">
                            <li><a href="/about" className="transition-opacity hover:opacity-70">Our Story</a></li>
                            <li><a href="/#craftsmanship" className="transition-opacity hover:opacity-70">Craftsmanship</a></li>
                            <li><a href="/sustainability" className="transition-opacity hover:opacity-70">Sustainability</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-neutral-200 text-sm text-neutral-600">
                    © Vinnys Vogue — Where Fashion Meets Elegance
                </div>
            </div>
        </footer>
    );
}
