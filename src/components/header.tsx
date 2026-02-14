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
        <header className="sticky top-0 z-50 glass">
            <div className="mx-auto flex w-full max-w-[1280px] items-center px-6 py-4">
                {/* Left — Logo */}
                <a href="/" className="group flex-shrink-0">
                    <div className="font-serif text-xl font-light tracking-[-0.02em] text-heading transition-colors group-hover:text-gold">
                        Vinnys <span className="text-gold italic">Vogue</span>
                    </div>
                </a>

                {/* Center — Nav Links (desktop) */}
                <nav className="hidden sm:flex items-center justify-center gap-8 flex-1">
                    <a
                        href="/"
                        className="text-[14px] font-medium text-muted tracking-wide transition-colors hover:text-heading"
                    >
                        Home
                    </a>
                    <a
                        href="/products"
                        className="text-[14px] font-medium text-muted tracking-wide transition-colors hover:text-heading"
                    >
                        Collections
                    </a>
                    <a
                        href="/about"
                        className="text-[14px] font-medium text-muted tracking-wide transition-colors hover:text-heading"
                    >
                        About
                    </a>
                </nav>

                {/* Right — Icons (desktop) */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    {isAdmin ? (
                        <a
                            href="/admin"
                            className="inline-flex h-9 items-center rounded-full border border-[rgba(0,0,0,0.08)] px-4 text-[13px] font-medium text-heading transition hover:border-gold hover:text-gold"
                        >
                            Admin
                        </a>
                    ) : null}

                    {user ? (
                        <a
                            href="/wishlist"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-muted transition hover:border-gold hover:text-gold"
                            aria-label="Wishlist"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8l3 3L12 21l5.8-7.6 3-3c1.6-1.6 1.6-4.2 0-5.8Z" />
                            </svg>
                            {wishlistCount > 0 ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium text-white">
                                    {wishlistCount > 99 ? "99+" : wishlistCount}
                                </span>
                            ) : null}
                        </a>
                    ) : null}

                    {user ? (
                        <a
                            href="/cart"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,0,0,0.08)] text-muted transition hover:border-gold hover:text-gold"
                            aria-label="Cart"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cartCount > 0 ? (
                                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium text-white">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            ) : null}
                        </a>
                    ) : null}

                    {user ? (
                        <form action="/logout" method="post">
                            <button className="ml-1 rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover-lift hover:bg-accent-hover">
                                Sign out
                            </button>
                        </form>
                    ) : (
                        <a
                            href="/login"
                            className="ml-1 rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white hover-lift hover:bg-accent-hover"
                        >
                            Sign in
                        </a>
                    )}
                </div>

                {/* Mobile — Hamburger + Drawer */}
                <div className="ml-auto sm:hidden">
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

