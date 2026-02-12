import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductImagePublicUrl,
  PRODUCT_IMAGE_BUCKET,
} from "@/lib/product-images";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import VariantManager from "@/components/variant-manager";

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
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  show_on_home: boolean;
  display_order: number;
  has_variants: boolean;
  stock: number;
  product_variants: VariantRow[];
};

function centsToDisplay(priceCents: number) {
  return (priceCents / 100).toFixed(2);
}

function displayToCents(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const numberValue = Number.parseFloat(normalized);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return Math.round(numberValue * 100);
}

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
      "id,title,description,category,price_cents,currency,image_path,active,show_on_home,display_order,has_variants,stock,product_variants(id,size,stock)",
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

  async function updateProduct(formData: FormData) {
    "use server";

    const productId = String(formData.get("product_id") || "").trim();
    if (!productId) {
      throw new Error("Missing product ID.");
    }

    const title = String(formData.get("title") || "").trim();
    const descriptionRaw = String(formData.get("description") || "");
    const description = descriptionRaw.trim() ? descriptionRaw.trim() : null;
    const categoryRaw = String(formData.get("category") || "").trim();
    const category = categoryRaw ? categoryRaw : null;

    const active = formData.get("active") === "on";
    const show_on_home = formData.get("show_on_home") === "on";
    const display_order = parseInt(String(formData.get("display_order") || "0"), 10) || 0;
    const has_variants = formData.get("has_variants") === "on";
    const stock = parseInt(String(formData.get("stock") || "0"), 10) || 0;
    const removeImage = formData.get("remove_image") === "on";
    const newImage = formData.get("image") as File | null;

    const priceDisplay = String(formData.get("price") || "");
    const nextPriceCents = displayToCents(priceDisplay);

    if (!title) {
      throw new Error("Title is required.");
    }

    if (nextPriceCents === null) {
      throw new Error("Please enter a valid price.");
    }

    const supabase = createSupabaseServerClient();

    // Fetch fresh product data inside the action (no outer scope dependency)
    const { data: currentProduct } = await supabase
      .from("products")
      .select("id, image_path, product_variants(id)")
      .eq("id", productId)
      .maybeSingle();

    if (!currentProduct) {
      throw new Error("Product not found.");
    }

    const currentImagePath: string | null = currentProduct.image_path;
    let nextImagePath: string | null = currentImagePath;

    if (removeImage && currentImagePath) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([currentImagePath]);
      nextImagePath = null;
    }

    if (newImage && newImage.size > 0) {
      const ext = newImage.name.includes(".")
        ? newImage.name.split(".").pop()!.toLowerCase()
        : "jpg";

      const uploadPath = `products/${productId}.${ext}`;

      if (currentImagePath && currentImagePath !== uploadPath) {
        await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .remove([currentImagePath]);
      }

      const uploadResult = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(uploadPath, newImage, {
          upsert: true,
          contentType: newImage.type || undefined,
        });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      nextImagePath = uploadPath;
    }

    const { error } = await supabase
      .from("products")
      .update({
        title,
        description,
        category,
        image_path: nextImagePath,
        active,
        show_on_home,
        display_order,
        price_cents: nextPriceCents,
        has_variants,
        stock: has_variants ? 0 : stock,
      })
      .eq("id", productId);

    if (error) {
      throw new Error(error.message);
    }

    // Handle variants
    if (has_variants) {
      const variantCount = parseInt(String(formData.get("variant_count") || "0"), 10);
      const submittedVariantIds: string[] = [];
      const newVariants: { product_id: string; size: string; stock: number }[] = [];

      for (let i = 0; i < variantCount; i++) {
        const variantId = String(formData.get(`variant_id_${i}`) || "").trim();
        const size = String(formData.get(`variant_size_${i}`) || "").trim();
        const variantStock = parseInt(String(formData.get(`variant_stock_${i}`) || "0"), 10) || 0;

        if (!size) continue;

        if (variantId) {
          // Update existing variant
          submittedVariantIds.push(variantId);
          await supabase
            .from("product_variants")
            .update({ size, stock: variantStock })
            .eq("id", variantId);
        } else {
          // New variant
          newVariants.push({
            product_id: productId,
            size,
            stock: variantStock,
          });
        }
      }

      // Delete removed variants (query fresh IDs from DB)
      const existingVariants = (currentProduct as { product_variants: { id: string }[] }).product_variants ?? [];
      const existingIds = existingVariants.map((v: { id: string }) => v.id);
      const toDelete = existingIds.filter((id: string) => !submittedVariantIds.includes(id));
      if (toDelete.length > 0) {
        await supabase
          .from("product_variants")
          .delete()
          .in("id", toDelete);
      }

      // Insert new variants
      if (newVariants.length > 0) {
        const { error: insertError } = await supabase
          .from("product_variants")
          .insert(newVariants);
        if (insertError) {
          throw new Error(insertError.message);
        }
      }
    } else {
      // If switching from variants to no-variants, delete all variants
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId);
    }

    redirect("/admin/products?updated=1");
  }

  async function deleteProduct(formData: FormData) {
    "use server";

    const productId = String(formData.get("product_id") || "").trim();
    if (!productId) {
      throw new Error("Missing product ID.");
    }

    const supabase = createSupabaseServerClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      throw new Error("Not authenticated.");
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Not authorized.");
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    redirect("/admin/products?deleted=1");
  }

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
                defaultValue={centsToDisplay(product.price_cents)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
              <div className="text-xs text-zinc-500">
                Stored as cents ({product.currency}). Example: 24999.00
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
              <textarea
                id="description"
                name="description"
                defaultValue={product.description ?? ""}
                rows={6}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
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

            {/* Has Variants toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">Has Variants</div>
                <div className="text-xs text-zinc-500">
                  Enable size variants with individual stock levels.
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  name="has_variants"
                  type="checkbox"
                  defaultChecked={product.has_variants}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-zinc-200 transition peer-checked:bg-zinc-900" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Variant rows */}
            <VariantManager
              initialVariants={safeVariants.length > 0 ? safeVariants : undefined}
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href="/admin/products"
                className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
              >
                Cancel
              </a>
              <button className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800">
                Save changes
              </button>
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
            <button
              type="submit"
              className="h-11 rounded-xl bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Delete Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
