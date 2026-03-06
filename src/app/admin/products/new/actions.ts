"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-images";
import { parsePrice } from "@/lib/parse-price";

export async function createProduct(formData: FormData) {
    const title = String(formData.get("title") || "").trim();
    const descriptionRaw = String(formData.get("description") || "");
    const description = descriptionRaw.trim() ? descriptionRaw.trim() : null;
    const categoryRaw = String(formData.get("category") || "").trim();
    const category = categoryRaw ? categoryRaw : null;

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

    // Handle multiple images
    const imageFiles = formData.getAll("images") as File[];
    const validImages = imageFiles.filter((f) => f && f.size > 0 && f.type.startsWith("image/"));

    let primaryImagePath: string | null = null;
    const extraImagePaths: string[] = [];

    // Generate a unique product ID prefix for uploads
    const idPrefix = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    for (let i = 0; i < validImages.length; i++) {
        const file = validImages[i];
        const ext = file.name.includes(".")
            ? file.name.split(".").pop()!.toLowerCase()
            : "jpg";
        const uploadPath = `products/${idPrefix}-${i}.${ext}`;

        const uploadResult = await supabase.storage
            .from(PRODUCT_IMAGE_BUCKET)
            .upload(uploadPath, file, {
                upsert: true,
                contentType: file.type || undefined,
            });

        if (uploadResult.error) {
            throw new Error(uploadResult.error.message);
        }

        if (i === 0) {
            primaryImagePath = uploadPath;
        } else {
            extraImagePaths.push(uploadPath);
        }
    }

    const { data: insertedProduct, error } = await supabase.from("products").insert({
        title,
        description,
        image_path: primaryImagePath,
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

    // Insert extra images into product_images table
    if (extraImagePaths.length > 0 && insertedProduct) {
        const imageRows = extraImagePaths.map((path, idx) => ({
            product_id: insertedProduct.id,
            image_path: path,
            display_order: idx + 1,
        }));

        const { error: imgError } = await supabase.from("product_images").insert(imageRows);
        if (imgError) {
            console.error("Failed to insert product images:", imgError);
        }
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
