import { Suspense } from "react";
import {
  FeaturedProducts,
  FeaturedProductsSkeleton,
} from "@/components/featured-products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export default async function Home() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-ivory text-foreground">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_30%_50%,rgba(199,166,83,0.4),transparent_70%)]" />

        <div className="relative mx-auto w-full max-w-6xl px-6 py-24 md:py-36">
          <div className="max-w-2xl animate-fade-in">
            <div className="text-xs tracking-[0.32em] text-gold uppercase">
              Wedding Couture
            </div>
            <h1 className="mt-5 font-serif text-4xl font-light leading-tight tracking-tight text-zinc-50 md:text-6xl md:leading-[1.1]">
              Crafted for the moments you will remember forever.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-300">
              Premium silhouettes, hand embroidery, and limited couture pieces —
              designed for the most important day of your life.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="/products"
                className="inline-flex h-12 items-center rounded-2xl bg-gold px-7 text-sm font-medium tracking-wide text-zinc-950 transition hover:brightness-95"
              >
                Explore Collection
              </a>
              {!user ? (
                <a
                  href="/login"
                  className="inline-flex h-12 items-center rounded-2xl border border-white/15 px-7 text-sm font-medium text-zinc-100 transition hover:bg-white/5"
                >
                  Sign in
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6">
        {/* ─── Categories ─── */}
        <section className="py-20">
          <div className="text-center animate-fade-in">
            <div className="text-xs tracking-[0.32em] text-gold uppercase">
              Curated Collections
            </div>
            <h2 className="mt-3 font-serif text-3xl font-light tracking-tight">
              Find your perfect look
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {PRODUCT_CATEGORIES.map((c, i) => (
              <a
                key={c.value}
                href={`/products?category=${encodeURIComponent(c.value)}`}
                className={`group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md animate-fade-in delay-${(i + 1) * 100}`}
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/5 transition group-hover:bg-gold/10" />
                <div className="relative">
                  <div className="text-sm font-medium tracking-tight text-zinc-900">
                    {c.label}
                  </div>
                  <div className="mt-2 text-xs text-warm-gray">
                    Explore →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ─── Featured Collection ─── */}
        <section className="border-t border-zinc-200/60 py-20">
          <div className="text-center animate-fade-in">
            <div className="text-xs tracking-[0.32em] text-gold uppercase">
              Hand-Picked
            </div>
            <h2 className="mt-3 font-serif text-3xl font-light tracking-tight">
              Featured Collection
            </h2>
            <p className="mt-3 text-sm text-warm-gray">
              Our most coveted pieces, selected with care.
            </p>
          </div>

          <div className="mt-12">
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <FeaturedProducts />
            </Suspense>
          </div>
        </section>

        {/* ─── Craftsmanship ─── */}
        <section className="border-t border-zinc-200/60 py-20">
          <div className="animate-fade-in">
            <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200/60 bg-white p-10 shadow-sm md:p-14">
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="text-xs tracking-[0.32em] text-gold uppercase">
                    Our Craft
                  </div>
                  <div className="font-serif text-2xl font-light tracking-tight">
                    Every stitch tells a story.
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-7 text-warm-gray">
                  <p>
                    Premium materials chosen for drape, lustre, and presence —
                    sourced from the finest mills and hand-inspected for quality.
                  </p>
                  <p>
                    Each piece features intricate hand embroidery by master
                    artisans, with meticulous attention to every detail.
                  </p>
                </div>
                <div className="space-y-4 text-sm leading-7 text-warm-gray">
                  <p>
                    Limited couture runs ensure exclusivity — every design is
                    produced in small batches, never mass-manufactured.
                  </p>
                  <p>
                    From bridal lehengas to reception gowns, every silhouette is
                    refined for measured finishing and timeless elegance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-200/60 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm tracking-[0.22em] text-warm-gray">
              VINNYS VOGUE
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Luxury Wedding Boutique
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm text-warm-gray">
            <a className="transition hover:text-zinc-900" href="/products">
              Collection
            </a>
            <a className="transition hover:text-zinc-900" href="/cart">
              Cart
            </a>
            <a className="transition hover:text-zinc-900" href="/login">
              Account
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
