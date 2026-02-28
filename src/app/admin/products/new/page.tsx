import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import VariantManager from "@/components/variant-manager";
const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-[rgba(0,0,0,0.03)]" /> }
);
import { AdminSubmitButton } from "@/components/ui/AdminSubmitButton";
import { createProduct } from "./actions";

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
