"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import { parsePrice } from "@/lib/parse-price";

export async function updateProduct(formData: FormData) {
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

    const priceRaw = formData.get("price");
    const priceDisplay = priceRaw != null ? String(priceRaw).trim() : "";
    let nextPrice = parsePrice(priceDisplay);

    if (!title) {
        throw new Error("Title is required.");
    }

    // If price is invalid or empty, fetch the current price from DB as fallback
    if (nextPrice === null || (priceDisplay === "" && nextPrice === 0)) {
        const { data: existingProduct } = await createSupabaseServerClient()
            .from("products")
            .select("price")
            .eq("id", productId)
            .maybeSingle();
        nextPrice = existingProduct?.price ?? nextPrice ?? 0;
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
            price: nextPrice,
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

export async function deleteProduct(formData: FormData) {
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

    // Use service-role client to bypass RLS and handle FK-dependent rows
    const { createClient } = await import("@supabase/supabase-js");
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch product to clean up storage image
    const { data: prod } = await serviceClient
        .from("products")
        .select("image_path")
        .eq("id", productId)
        .maybeSingle();

    // Delete dependent rows that lack ON DELETE CASCADE
    await serviceClient.from("cart_items").delete().eq("product_id", productId);
    await serviceClient.from("inventory_logs").delete().eq("product_id", productId);
    await serviceClient.from("reviews").delete().eq("product_id", productId);
    await serviceClient.from("wishlist").delete().eq("product_id", productId);

    // Nullify order_items references (preserve order history, just unlink product)
    await serviceClient.from("order_items").update({ product_id: null }).eq("product_id", productId);

    // Delete product variants first (FK child)
    await serviceClient.from("product_variants").delete().eq("product_id", productId);

    // Delete the product
    const { error: deleteError } = await serviceClient
        .from("products")
        .delete()
        .eq("id", productId);

    if (deleteError) {
        throw new Error(deleteError.message);
    }

    // Clean up product image from storage
    if (prod?.image_path) {
        await serviceClient.storage.from(PRODUCT_IMAGE_BUCKET).remove([prod.image_path]);
    }

    redirect("/admin/products?deleted=1");
}
