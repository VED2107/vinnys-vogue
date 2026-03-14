import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const { supabase, response } = createSupabaseMiddlewareClient(req);

    // Refresh the session so the JWT stays alive across requests
    await supabase.auth.getUser();

    // ── Security headers ────────────────────────────────────
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
    );
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
    );

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all routes except:
         * - _next/static (static files)
         * - _next/image  (image optimisation)
         * - favicon.ico  (browser icon)
         * - public assets (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};

