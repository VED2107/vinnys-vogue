import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for the password-otp Edge Function.
 * Uses the ANON key (not service_role) — the Edge Function itself
 * already initialises its own service-role client internally.
 * This keeps service_role confined to the Edge Function only.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            console.error("[password-otp proxy] Missing env vars:", { supabaseUrl: !!supabaseUrl, anonKey: !!anonKey });
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 },
            );
        }

        const edgeUrl = `${supabaseUrl}/functions/v1/password-otp`;
        console.log("[password-otp proxy] Calling:", edgeUrl);

        const response = await fetch(edgeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${anonKey}`,
                "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
            },
            body: JSON.stringify(body),
        });

        const text = await response.text();
        console.log("[password-otp proxy] Edge response status:", response.status, "body:", text);

        // Try to parse as JSON, fall back to raw text
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data, { status: response.status });
        } catch {
            return NextResponse.json(
                { error: text || "Edge function error" },
                { status: response.status },
            );
        }
    } catch (err) {
        console.error("[password-otp proxy] Caught error:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 },
        );
    }
}
