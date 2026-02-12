import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGE_BUCKET = "product-images";

export const PRODUCT_IMAGE_PLACEHOLDER_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect width='800' height='1000' fill='%23f4f4f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-family='Arial,Helvetica,sans-serif' font-size='28'%3ENo image%3C/text%3E%3C/svg%3E";

export function getProductImagePublicUrl(
  supabase: SupabaseClient,
  imagePath: string | null,
) {
  if (!imagePath) return PRODUCT_IMAGE_PLACEHOLDER_DATA_URL;

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl || PRODUCT_IMAGE_PLACEHOLDER_DATA_URL;
}
