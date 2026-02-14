import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinnysvogue.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin/", "/api/", "/login", "/signup", "/logout"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
