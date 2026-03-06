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

    // Fetch fresh product data
    const { data: currentProduct } = await supabase
        .from("products")
        .select("id, image_path, product_variants(id)")
        .eq("id", productId)
        .maybeSingle();

    if (!currentProduct) {
        throw new Error("Product not found.");
    }

    const currentImagePath: string | null = currentProduct.image_path;

    // Handle image removals
    const removedImageIds = formData.getAll("removed_image_ids") as string[];

    // If the primary image was removed
    let nextImagePath: string | null = currentImagePath;
    if (removedImageIds.includes("primary") && currentImagePath) {
        await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([currentImagePath]);
        nextImagePath = null;
    }

    // Remove extra images from storage and DB
    if (removedImageIds.length > 0) {
        const nonPrimaryRemovedIds = removedImageIds.filter((id) => id !== "primary");
        if (nonPrimaryRemovedIds.length > 0) {
            // Fetch paths before deleting
            const { data: imagesToRemove } = await supabase
                .from("product_images")
                .select("id, image_path")
                .in("id", nonPrimaryRemovedIds);

            if (imagesToRemove && imagesToRemove.length > 0) {
                const pathsToRemove = imagesToRemove.map((img: { image_path: string }) => img.image_path);
                await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(pathsToRemove);
                await supabase
                    .from("product_images")
                    .delete()
                    .in("id", nonPrimaryRemovedIds);
            }
        }
    }

    // Handle new image uploads
    const imageFiles = formData.getAll("images") as File[];
    const validImages = imageFiles.filter((f) => f && f.size > 0 && f.type.startsWith("image/"));

    const newImagePaths: string[] = [];
    for (let i = 0; i < validImages.length; i++) {
        const file = validImages[i];
        const ext = file.name.includes(".")
            ? file.name.split(".").pop()!.toLowerCase()
            : "jpg";
        const fileName = globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const uploadPath = `products/${fileName}.${ext}`;

        const uploadResult = await supabase.storage
            .from(PRODUCT_IMAGE_BUCKET)
            .upload(uploadPath, file, {
                upsert: true,
                contentType: file.type || undefined,
            });

        if (uploadResult.error) {
            throw new Error(uploadResult.error.message);
        }

        newImagePaths.push(uploadPath);
    }

    // If primary was removed and we have new images, set first new one as primary
    if (!nextImagePath && newImagePaths.length > 0) {
        nextImagePath = newImagePaths.shift()!;
    }

    // If still no primary but we have existing extra images, promote one
    if (!nextImagePath) {
        const { data: firstExtra } = await supabase
            .from("product_images")
            .select("id, image_path")
            .eq("product_id", productId)
            .order("display_order", { ascending: true })
            .limit(1)
            .maybeSingle();
        if (firstExtra) {
            nextImagePath = firstExtra.image_path;
            // Remove it from product_images since it's now the primary
            await supabase.from("product_images").delete().eq("id", firstExtra.id);
        }
    }

    // Insert new extra images into product_images
    if (newImagePaths.length > 0) {
        // Get current max display_order
        const { data: maxOrderRow } = await supabase
            .from("product_images")
            .select("display_order")
            .eq("product_id", productId)
            .order("display_order", { ascending: false })
            .limit(1)
            .maybeSingle();

        const startOrder = (maxOrderRow?.display_order ?? 0) + 1;

        const imageRows = newImagePaths.map((path, idx) => ({
            product_id: productId,
            image_path: path,
            display_order: startOrder + idx,
        }));

        const { error: imgError } = await supabase.from("product_images").insert(imageRows);
        if (imgError) {
            console.error("Failed to insert product images:", imgError);
        }
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
                submittedVariantIds.push(variantId);
                await supabase
                    .from("product_variants")
                    .update({ size, stock: variantStock })
                    .eq("id", variantId);
            } else {
                newVariants.push({
                    product_id: productId,
                    size,
                    stock: variantStock,
                });
            }
        }

        const existingVariants = (currentProduct as { product_variants: { id: string }[] }).product_variants ?? [];
        const existingIds = existingVariants.map((v: { id: string }) => v.id);
        const toDelete = existingIds.filter((id: string) => !submittedVariantIds.includes(id));
        if (toDelete.length > 0) {
            await supabase
                .from("product_variants")
                .delete()
                .in("id", toDelete);
        }

        if (newVariants.length > 0) {
            const { error: insertError } = await supabase
                .from("product_variants")
                .insert(newVariants);
            if (insertError) {
                throw new Error(insertError.message);
            }
        }
    } else {
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

    // Fetch product + extra images to clean up storage
    const { data: prod } = await serviceClient
        .from("products")
        .select("image_path")
        .eq("id", productId)
        .maybeSingle();

    const { data: extraImages } = await serviceClient
        .from("product_images")
        .select("image_path")
        .eq("product_id", productId);

    // Collect all image paths to remove from storage
    const pathsToRemove: string[] = [];
    if (prod?.image_path) pathsToRemove.push(prod.image_path);
    if (extraImages) {
        for (const img of extraImages as { image_path: string }[]) {
            pathsToRemove.push(img.image_path);
        }
    }

    // Delete dependent rows that lack ON DELETE CASCADE
    await serviceClient.from("cart_items").delete().eq("product_id", productId);
    await serviceClient.from("inventory_logs").delete().eq("product_id", productId);
    await serviceClient.from("reviews").delete().eq("product_id", productId);
    await serviceClient.from("wishlist").delete().eq("product_id", productId);

    // Nullify order_items references (preserve order history, just unlink product)
    await serviceClient.from("order_items").update({ product_id: null }).eq("product_id", productId);

    // Delete product images (FK child with cascade, but just in case)
    await serviceClient.from("product_images").delete().eq("product_id", productId);

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

    // Clean up all product images from storage
    if (pathsToRemove.length > 0) {
        await serviceClient.storage.from(PRODUCT_IMAGE_BUCKET).remove(pathsToRemove);
    }

    redirect("/admin/products?deleted=1");
}
