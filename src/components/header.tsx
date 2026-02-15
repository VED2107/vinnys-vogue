import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MobileNav } from "@/components/mobile-nav";

export async function Header() {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const profile = user
        ? await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
            .then((r) => r.data)
        : null;

    const isAdmin = profile?.role === "admin";

    let cartCount = 0;
    let wishlistCount = 0;
    if (user) {
        const { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (cart) {
            const { data: items } = await supabase
                .from("cart_items")
                .select("quantity")
                .eq("cart_id", cart.id);

            cartCount = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);
        }

        const { count } = await supabase
            .from("wishlist")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);

        wishlistCount = count ?? 0;
    }

    return (
        <header className="w-full bg-[#F4EFE8] border-b border-neutral-200">
            <div className="flex items-center justify-between h-[88px] px-6 lg:px-16 xl:px-24">
                {/* Left — Wordmark + Tagline */}
                <Link href="/" className="group">
                    <h1 className="font-serif text-[18px] tracking-[0.25em] uppercase font-normal text-[#1C1A18]">
                        Vinnys{" "}
                        <span className="font-serif italic font-normal text-[color:var(--gold)]">
                            Vogue
                        </span>
                    </h1>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 mt-0.5">
                        Where Fashion Meets Elegance
                    </p>
                </Link>

                {/* Center — Nav Links (desktop) */}
                <nav className="hidden sm:flex items-center gap-8">
                    <Link href="/" className="nav-link-editorial text-[12px] tracking-[0.25em] uppercase font-light text-[#1C1A18]">
                        Home
                    </Link>
                    <Link href="/products" className="nav-link-editorial text-[12px] tracking-[0.25em] uppercase font-light text-[#1C1A18]">
                        Collections
                    </Link>
                    <Link href="/about" className="nav-link-editorial text-[12px] tracking-[0.25em] uppercase font-light text-[#1C1A18]">
                        About
                    </Link>
                </nav>

                {/* Right — Icons (desktop) */}
                <div className="hidden sm:flex items-center gap-4">
                    {isAdmin ? (
                        <Link
                            href="/admin"
                            className="nav-link-editorial text-[12px] tracking-[0.2em] uppercase font-light text-[#1C1A18] leading-none py-2"
                        >
                            Admin
                        </Link>
                    ) : null}

                    {user ? (
                        <Link
                            href="/wishlist"
                            className="nav-link-editorial relative inline-flex items-center justify-center text-[#1C1A18] py-1"
                            aria-label="Wishlist"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l3 3L12 21l5.8-7.6 3-3c1.6-1.6 1.6-4.2 0-5.8Z" />
                            </svg>
                            {wishlistCount > 0 ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1C3A2A] px-1 text-[9px] font-medium text-white">
                                    {wishlistCount > 99 ? "99+" : wishlistCount}
                                </span>
                            ) : null}
                        </Link>
                    ) : null}

                    {user ? (
                        <Link
                            href="/cart"
                            className="nav-link-editorial relative inline-flex items-center justify-center text-[#1C1A18] py-1"
                            aria-label="Cart"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cartCount > 0 ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1C3A2A] px-1 text-[9px] font-medium text-white">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            ) : null}
                        </Link>
                    ) : null}

                    {user ? (
                        <form action="/logout" method="post">
                            <button className="nav-link-editorial text-[12px] tracking-[0.15em] uppercase font-light text-[#1C1A18] leading-none py-2">
                                Sign out
                            </button>
                        </form>
                    ) : (
                        <Link
                            href="/login"
                            className="nav-link-editorial text-[12px] tracking-[0.15em] uppercase font-light text-[#1C1A18] leading-none py-2"
                        >
                            Sign in
                        </Link>
                    )}
                </div>

                {/* Mobile — Hamburger */}
                <div className="sm:hidden">
                    <MobileNav
                        isLoggedIn={!!user}
                        isAdmin={isAdmin}
                        cartCount={cartCount}
                        wishlistCount={wishlistCount}
                    />
                </div>
            </div>
        </header>
    );
}
