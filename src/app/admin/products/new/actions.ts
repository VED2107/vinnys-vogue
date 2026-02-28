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
