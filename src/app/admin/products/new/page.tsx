import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import VariantManager from "@/components/variant-manager";
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-[rgba(0,0,0,0.03)]" /> }
);
import { AdminSubmitButton } from "@/components/ui/AdminSubmitButton";

function parsePrice(value: string | null | undefined) {
  if (!value || !value.trim()) return 0;
  const normalized = value.replace(/,/g, "").replace(/₹/g, "").trim();
  const numberValue = Number.parseFloat(normalized);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return Math.round(numberValue * 100) / 100;
}

export default async function AdminNewProductPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/products/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  async function createProduct(formData: FormData) {
    "use server";

    const title = String(formData.get("title") || "").trim();
    const descriptionRaw = String(formData.get("description") || "");
    const description = descriptionRaw.trim() ? descriptionRaw.trim() : null;
    const categoryRaw = String(formData.get("category") || "").trim();
    const category = categoryRaw ? categoryRaw : null;

    const image = formData.get("image") as File | null;

    const currencyRaw = String(formData.get("currency") || "INR").trim();
    const currency = currencyRaw ? currencyRaw : "INR";

    const active = formData.get("active") === "on";
    const show_on_home = formData.get("show_on_home") === "on";
    const display_order = parseInt(String(formData.get("display_order") || "0"), 10) || 0;
    const has_variants = formData.get("has_variants") === "on";
    const stock = parseInt(String(formData.get("stock") || "0"), 10) || 0;

    const priceDisplay = String(formData.get("price") || "");
    const price = parsePrice(priceDisplay);

    if (!title) {
      throw new Error("Title is required.");
    }

    if (price === null) {
      throw new Error("Please enter a valid price.");
    }

    const supabase = createSupabaseServerClient();

    let image_path: string | null = null;

    if (image && image.size > 0) {
      const ext = image.name.includes(".")
        ? image.name.split(".").pop()!.toLowerCase()
        : "jpg";
      const fileName = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const uploadPath = `products/${fileName}.${ext}`;

      const uploadResult = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(uploadPath, image, {
          upsert: true,
          contentType: image.type || undefined,
        });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      image_path = uploadPath;
    }

    const { data: insertedProduct, error } = await supabase.from("products").insert({
      title,
      description,
      image_path,
      category,
      currency,
      price,
      active,
      show_on_home,
      display_order,
      has_variants,
      stock: has_variants ? 0 : stock,
    }).select("id").single();

    if (error) {
      throw new Error(error.message);
    }

    // Insert variants if has_variants is true
    if (has_variants && insertedProduct) {
      const variantCount = parseInt(String(formData.get("variant_count") || "0"), 10);
      const variants: { product_id: string; size: string; stock: number }[] = [];

      for (let i = 0; i < variantCount; i++) {
        const size = String(formData.get(`variant_size_${i}`) || "").trim();
        const variantStock = parseInt(String(formData.get(`variant_stock_${i}`) || "0"), 10) || 0;
        if (size) {
          variants.push({
            product_id: insertedProduct.id,
            size,
            stock: variantStock,
          });
        }
      }

      if (variants.length > 0) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(variants);
        if (variantError) {
          throw new Error(variantError.message);
        }
      }
    }

    redirect("/admin/products?created=1");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight">Add product</h1>
            <p className="text-sm text-zinc-600">Create a new listing.</p>
          </div>
          <a
            href="/admin/products"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
          >
            Back
          </a>
        </div>

        <form
          action={createProduct}
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900" htmlFor="price">
                  Price
                </label>
                <input
                  id="price"
                  name="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-900"
                  htmlFor="currency"
                >
                  Currency
                </label>
                <input
                  id="currency"
                  name="currency"
                  type="text"
                  defaultValue="INR"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-900"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  required
                >
                  <option value="" disabled selected>
                    Select category…
                  </option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-zinc-900"
                htmlFor="description"
              >
                Description
              </label>
              <RichTextEditor name="description" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="image">
                Image
              </label>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-50 hover:file:bg-zinc-800"
              />
              <div className="text-xs text-zinc-500">
                Uploads to product-images bucket. Saved as a storage object path.
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="display_order">
                Display Order
              </label>
              <input
                id="display_order"
                name="display_order"
                type="number"
                defaultValue={0}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
              <div className="text-xs text-zinc-500">
                Lower numbers appear first on the homepage featured section.
              </div>
            </div>

            {/* Stock (simple, no variants) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="stock">
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                defaultValue={0}
                min={0}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
              <div className="text-xs text-zinc-500">
                Used when product does not have variants.
              </div>
            </div>

            {/* Variant management (toggle + rows) */}
            <VariantManager />

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">Active</div>
                <div className="text-xs text-zinc-500">
                  Active products appear on the public collection.
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input name="active" type="checkbox" defaultChecked className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-zinc-900" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Show on Home toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">Show on Home</div>
                <div className="text-xs text-zinc-500">
                  Feature this product on the homepage.
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input name="show_on_home" type="checkbox" className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-[#c7a653]" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href="/admin"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
              >
                Dashboard
              </a>
              <AdminSubmitButton className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800" pendingText="Creating…">
                Create product
              </AdminSubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
