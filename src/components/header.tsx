import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    // Lightweight cart count query — sum of quantities, RLS-safe
    let cartCount = 0;
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
    }

    return (
        <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                <a href="/" className="space-y-0.5">
                    <div className="text-sm tracking-[0.22em] text-zinc-500">
                        VINNYS VOGUE
                    </div>
                    <div className="text-lg font-medium tracking-tight text-zinc-900">
                        Luxury Wedding Boutique
                    </div>
                </a>

                <nav className="flex items-center gap-3">
                    {isAdmin ? (
                        <a
                            href="/admin"
                            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                        >
                            Admin
                        </a>
                    ) : null}

                    {user ? (
                        <a
                            href="/cart"
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                            aria-label="Cart"
                        >
                            {/* Shopping bag SVG icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" x2="21" y1="6" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>

                            {cartCount > 0 ? (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            ) : null}
                        </a>
                    ) : null}

                    {user ? (
                        <form action="/logout" method="post">
                            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800">
                                Sign out
                            </button>
                        </form>
                    ) : (
                        <a
                            href="/login"
                            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800"
                        >
                            Sign in
                        </a>
                    )}
                </nav>
            </div>
        </header>
    );
}
