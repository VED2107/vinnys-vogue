/** @type {import('next').NextConfig} */
const nextConfig = {
    /* ── Hide framework fingerprint ── */
    poweredByHeader: false,

    /* ── React strict mode for development hygiene ── */
    reactStrictMode: true,

    experimental: {
        serverComponentsExternalPackages: ["pdfkit"],
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                "127.0.0.1:3000",
                "localhost",
                "127.0.0.1",
                "www.vinnysvogue.in",
                "vinnysvogue.in",
            ],
            bodySizeLimit: "2mb",
        },
    },

    /* ── Image fidelity + caching ── */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "jluenrlmtfpawqfuc.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
            {
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
        ],
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30,       // 30 days
        deviceSizes: [640, 750, 828, 1080, 1200],  // matches our breakpoints
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },

    /* ── Compiler optimisations ── */
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error", "warn"] }
                : false,
    },

    /* ── Security & caching headers ── */
    async headers() {
        return [
            /* Security headers — all routes */
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
            /* Immutable cache for static assets */
            {
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            /* Long cache for optimised images */
            {
                source: "/_next/image",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=2592000, stale-while-revalidate=86400",
                    },
                ],
            },
            /* Static public assets (favicon, manifest, etc.) */
            {
                source: "/:all*(ico|png|jpg|jpeg|svg|webp|avif|woff2|json)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=2592000, stale-while-revalidate=86400",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
