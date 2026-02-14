import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { getCategoryLabel, PRODUCT_CATEGORIES } from "@/lib/categories";
import StockAdjustModal from "@/components/admin/stock-adjust-modal";
import { FadeIn } from "@/components/fade-in";

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
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

  let query = supabase.from("products").select("id,title,price_cents,currency,image_path,active,category,show_on_home,display_order,stock,created_at").order("created_at", { ascending: false });
  if (filterCategory) query = query.eq("category", filterCategory);

  const { data, error } = await query;
  if (error) {
    return (
      <div className="min-h-screen bg-bg-admin">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[15px] text-muted">{error.message}</div>
        </div>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
        <FadeIn>
          <div className="flex items-end justify-between gap-6">
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
          <div className="mt-10 overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white">
            <div className="grid grid-cols-12 gap-4 border-b border-[rgba(0,0,0,0.06)] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.15em] text-muted">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {products.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="h-14 w-12 overflow-hidden rounded-[10px] bg-[#EDE8E0]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getProductImagePublicUrl(supabase, p.image_path)} alt={p.title} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-heading line-clamp-1">{p.title}</div>
                      {p.show_on_home ? <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gold"><span className="inline-block h-1 w-1 rounded-full bg-gold" /> Featured</div> : null}
                      {p.stock < 3 ? <div className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">Low stock</div> : null}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    {p.category ? <span className="inline-flex items-center rounded-full bg-[#F4EFE8] px-2.5 py-1 text-[12px] text-heading">{getCategoryLabel(p.category)}</span> : <span className="text-[12px] text-muted">—</span>}
                  </div>
                  <div className="col-span-2 flex items-center font-serif text-[14px] font-light text-gold">{formatMoneyFromCents(p.price_cents, p.currency)}</div>
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${p.active ? "bg-green-50 text-green-800" : "bg-[#F4EFE8] text-muted"}`}>{p.active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={`text-[14px] ${p.stock < 3 ? "text-red-700 font-medium" : "text-heading"}`}>{p.stock}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <a href={`/admin/products/${p.id}`} className="h-8 rounded-full border border-[rgba(0,0,0,0.1)] px-3 text-[12px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center">Edit</a>
                    <StockAdjustModal productId={p.id} productTitle={p.title} currentStock={p.stock} />
                    <form action={toggleActive}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="current" value={String(p.active)} />
                      <button className="h-8 rounded-full bg-accent px-3 text-[12px] font-medium text-white hover:bg-accent-hover">Toggle</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
