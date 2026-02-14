import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinnysvogue.com";

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
        { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
        { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
        { url: `${baseUrl}/shipping-returns`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
        { url: `${baseUrl}/size-guide`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    ];

    // Dynamic product pages
    const supabase = createSupabaseServerClient();
    const { data: products } = await supabase
        .from("products")
        .select("id, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false });

    const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
        url: `${baseUrl}/product/${p.id}`,
        lastModified: new Date(p.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...productPages];
}
