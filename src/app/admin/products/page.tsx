import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoneyFromCents } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { getCategoryLabel, PRODUCT_CATEGORIES } from "@/lib/categories";

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
  created_at: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: { updated?: string; created?: string; deleted?: string; category?: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/products");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  async function toggleActive(formData: FormData) {
    "use server";

    const productId = String(formData.get("productId") || "");
    const current = String(formData.get("current") || "");

    if (!productId) return;

    const supabase = createSupabaseServerClient();

    const nextActive = current !== "true";

    await supabase
      .from("products")
      .update({ active: nextActive })
      .eq("id", productId);

    redirect("/admin/products");
  }

  const filterCategory = searchParams?.category;

  let query = supabase
    .from("products")
    .select(
      "id,title,price_cents,currency,image_path,active,category,show_on_home,display_order,created_at",
    )
    .order("created_at", { ascending: false });

  if (filterCategory) {
    query = query.eq("category", filterCategory);
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight">Products</h1>
            <p className="text-sm text-zinc-600">
              Manage status, categories, and homepage features.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/products/new"
              className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 inline-flex items-center"
            >
              Add Product
            </a>
            <a
              href="/admin"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
            >
              Back
            </a>
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a
            href="/admin/products"
            className={`inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition ${!filterCategory
                ? "bg-zinc-900 text-zinc-50"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
          >
            All
          </a>
          {PRODUCT_CATEGORIES.map((c) => (
            <a
              key={c.value}
              href={`/admin/products?category=${encodeURIComponent(c.value)}`}
              className={`inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition ${filterCategory === c.value
                  ? "bg-zinc-900 text-zinc-50"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
            >
              {c.label}
            </a>
          ))}
        </div>

        {searchParams?.updated === "1" ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
            Changes saved.
          </div>
        ) : null}

        {searchParams?.created === "1" ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
            Product created.
          </div>
        ) : null}

        {searchParams?.deleted === "1" ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            Product deleted.
          </div>
        ) : null}

        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-zinc-200 px-6 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            <div className="col-span-4">Product</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-zinc-200">
            {products.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4">
                <div className="col-span-4 flex items-center gap-4">
                  <div className="h-14 w-12 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImagePublicUrl(supabase, p.image_path)}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 line-clamp-1">
                      {p.title}
                    </div>
                    {p.show_on_home ? (
                      <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Featured
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  {p.category ? (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {getCategoryLabel(p.category)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </div>

                <div className="col-span-2 flex items-center text-sm text-zinc-700">
                  {formatMoneyFromCents(p.price_cents, p.currency)}
                </div>

                <div className="col-span-2 flex items-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${p.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-700"
                      }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <a
                    href={`/admin/products/${p.id}`}
                    className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
                  >
                    Edit
                  </a>
                  <form action={toggleActive}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="current" value={String(p.active)} />
                    <button className="h-9 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800">
                      Toggle
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
