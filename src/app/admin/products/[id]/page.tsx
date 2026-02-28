import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductImagePublicUrl,
  PRODUCT_IMAGE_BUCKET,
} from "@/lib/product-images";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import VariantManager from "@/components/variant-manager";
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-[rgba(0,0,0,0.03)]" /> }
);
import { AdminSubmitButton } from "@/components/ui/AdminSubmitButton";
import { updateProduct, deleteProduct } from "./actions";

type VariantRow = {
  id: string;
  size: string;
  stock: number;
};

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  show_on_home: boolean;
  display_order: number;
  has_variants: boolean;
  stock: number;
  product_variants: VariantRow[];
};

export default async function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/products/${params.id}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,description,category,price,currency,image_path,active,show_on_home,display_order,has_variants,stock,product_variants(id,size,stock)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    redirect("/admin/products");
  }

  const product = data as ProductRow;
  const currentImageUrl = getProductImagePublicUrl(supabase, product.image_path);

  const safeVariants =
    product.product_variants?.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
    })) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight">Edit product</h1>
            <p className="text-sm text-zinc-600">Update details and image.</p>
          </div>
          <a
            href="/admin/products"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
          >
            Back
          </a>
        </div>

        <form
          action={updateProduct}
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="product_id" value={product.id} />
          <div className="grid grid-cols-1 gap-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-zinc-900">Image</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-20 w-16 overflow-hidden rounded-xl bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-50 hover:file:bg-zinc-800"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      name="remove_image"
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    Remove current image
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue={product.title}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="price">
                Price
              </label>
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                defaultValue={String(product.price ?? 0)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                required
              />
              <div className="text-xs text-zinc-500">
                Stored in rupees ({product.currency}). Example: 249.99
              </div>
            </div>

            {/* Category dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={product.category ?? ""}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                required
              >
                <option value="" disabled>
                  Select category…
                </option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900" htmlFor="description">
                Description
              </label>
              <RichTextEditor name="description" defaultValue={product.description ?? ""} />
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
                defaultValue={product.display_order}
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
                defaultValue={product.stock}
                min={0}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
              <div className="text-xs text-zinc-500">
                Used when product does not have variants.
              </div>
            </div>

            {/* Variant management (toggle + rows) */}
            <VariantManager
              initialVariants={safeVariants.length > 0 ? safeVariants : undefined}
              initialEnabled={product.has_variants}
            />

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">Active</div>
                <div className="text-xs text-zinc-500">
                  Inactive products won&apos;t appear on the public collection.
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={product.active}
                  className="peer sr-only"
                />
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
                <input
                  name="show_on_home"
                  type="checkbox"
                  defaultChecked={product.show_on_home}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-gold" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <a
                href="/admin/products"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
              >
                Cancel
              </a>
              <AdminSubmitButton className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800" pendingText="Saving…">
                Save changes
              </AdminSubmitButton>
            </div>
          </div>
        </form>

        {/* Danger zone — Delete */}
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="space-y-1">
            <div className="text-sm font-medium text-red-900">Danger zone</div>
            <div className="text-xs text-red-700">
              Permanently delete this product. This action cannot be undone.
            </div>
          </div>
          <form action={deleteProduct} className="mt-4">
            <input type="hidden" name="product_id" value={product.id} />
            <AdminSubmitButton className="h-11 rounded-xl bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700" pendingText="Deleting…">
              Delete Product
            </AdminSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
