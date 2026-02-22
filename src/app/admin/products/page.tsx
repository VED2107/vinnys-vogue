import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { getCategoryLabel, PRODUCT_CATEGORIES } from "@/lib/categories";
import dynamic from "next/dynamic";
import { FadeIn } from "@/components/fade-in";

const StockAdjustModal = dynamic(
  () => import("@/components/admin/stock-adjust-modal"),
  { ssr: false, loading: () => <span className="h-6 w-12 rounded-full bg-[rgba(0,0,0,0.04)] inline-block" /> }
);

type ProductRow = {
  id: string;
  title: string;
  price: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  category: string | null;
  show_on_home: boolean;
  display_order: number;
  stock: number;
  created_at: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: { updated?: string; created?: string; deleted?: string; category?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/products");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/");

  async function toggleActive(formData: FormData) {
    "use server";
    const productId = String(formData.get("productId") || "");
    const current = String(formData.get("current") || "");
    if (!productId) return;
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!p || p.role !== "admin") return;
    await supabase.from("products").update({ active: current !== "true" }).eq("id", productId);
    redirect("/admin/products");
  }

  const filterCategory = searchParams?.category;

  let query = supabase.from("products").select("id,title,price,currency,image_path,active,category,show_on_home,display_order,stock,created_at").order("created_at", { ascending: false });
  if (filterCategory) query = query.eq("category", filterCategory);

  const { data, error } = await query;
  if (error) {
    return (
      <div className="min-h-screen bg-bg-admin">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16">
          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[15px] text-muted">{error.message}</div>
        </div>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="gold-divider" />
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Catalogue</div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">Products</h1>
              <p className="text-[15px] text-muted">Manage status, categories, and homepage features.</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/admin/products/new" className="h-10 rounded-full bg-accent px-6 text-[14px] font-medium text-white hover-lift hover:bg-accent-hover inline-flex items-center">Add Product</a>
              <a href="/admin" className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center">Back</a>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <a href="/admin/products" className={`inline-flex h-9 items-center rounded-full px-5 text-[13px] transition ${!filterCategory ? "bg-accent text-white font-medium" : "border border-[rgba(0,0,0,0.1)] text-muted hover:text-heading hover:border-[rgba(0,0,0,0.2)]"}`}>All</a>
            {PRODUCT_CATEGORIES.map((c) => (
              <a key={c.value} href={`/admin/products?category=${encodeURIComponent(c.value)}`} className={`inline-flex h-9 items-center rounded-full px-5 text-[13px] transition ${filterCategory === c.value ? "bg-accent text-white font-medium" : "border border-[rgba(0,0,0,0.1)] text-muted hover:text-heading hover:border-[rgba(0,0,0,0.2)]"}`}>{c.label}</a>
            ))}
          </div>
        </FadeIn>

        {searchParams?.updated === "1" ? <div className="mt-6 rounded-[20px] border border-gold/20 bg-gold/5 p-4 text-[14px] text-heading">Changes saved.</div> : null}
        {searchParams?.created === "1" ? <div className="mt-4 rounded-[20px] border border-gold/20 bg-gold/5 p-4 text-[14px] text-heading">Product created.</div> : null}
        {searchParams?.deleted === "1" ? <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-700">Product deleted.</div> : null}

        <FadeIn delay={0.1}>
          {products.length === 0 ? (
            <div className="mt-10 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white px-6 py-16 text-center text-[15px] text-muted">
              No products found.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* ── Image ── */}
                  <a href={`/admin/products/${p.id}`} className="relative block aspect-[3/4] overflow-hidden bg-[#EDE8E0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImagePublicUrl(supabase, p.image_path)}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* ── Overlay Badges (top-left) ── */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm ${p.active ? "bg-green-500/90 text-white" : "bg-zinc-800/80 text-zinc-300"}`}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                      {p.show_on_home ? (
                        <span className="inline-flex items-center rounded-md bg-gold/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          ★ Featured
                        </span>
                      ) : null}
                      {p.stock < 3 ? (
                        <span className="inline-flex items-center rounded-md bg-red-500/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          Low Stock
                        </span>
                      ) : null}
                    </div>

                    {/* ── Stock count (top-right) ── */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center justify-center min-w-[24px] h-6 rounded-md px-1.5 text-[10px] font-bold backdrop-blur-sm ${p.stock < 3 ? "bg-red-500/90 text-white" : "bg-white/85 text-heading shadow-sm"}`}>
                        {p.stock}
                      </span>
                    </div>
                  </a>

                  {/* ── Product Info ── */}
                  <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                    {p.category ? (
                      <span className="mb-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-muted line-clamp-1">
                        {getCategoryLabel(p.category)}
                      </span>
                    ) : null}

                    <a
                      href={`/admin/products/${p.id}`}
                      className="text-[12px] sm:text-[13px] font-medium text-heading leading-snug line-clamp-2 hover:text-gold transition-colors"
                    >
                      {p.title}
                    </a>

                    <div className="mt-auto pt-2 font-serif text-[13px] sm:text-[15px] font-light text-gold">
                      {formatMoney(p.price, p.currency)}
                    </div>

                    {/* ── Compact Actions ── */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <a
                        href={`/admin/products/${p.id}`}
                        className="h-6 sm:h-7 rounded-full border border-[rgba(0,0,0,0.1)] px-2 sm:px-2.5 text-[10px] sm:text-[11px] text-heading transition hover:border-[rgba(0,0,0,0.2)] hover:bg-zinc-50 inline-flex items-center"
                      >
                        Edit
                      </a>
                      <StockAdjustModal productId={p.id} productTitle={p.title} currentStock={p.stock} />
                      <form action={toggleActive}>
                        <input type="hidden" name="productId" value={p.id} />
                        <input type="hidden" name="current" value={String(p.active)} />
                        <button className="h-6 sm:h-7 rounded-full bg-accent px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-medium text-white hover:bg-accent-hover transition">
                          {p.active ? "Hide" : "Show"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
