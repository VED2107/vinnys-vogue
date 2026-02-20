import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for the signup-otp Edge Function.
 * Uses the ANON key — Edge Function handles service_role internally.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            console.error("[signup-otp proxy] Missing env vars");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 },
            );
        }

        const edgeUrl = `${supabaseUrl}/functions/v1/signup-otp`;

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
        console.error("[signup-otp proxy] Caught error:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 },
        );
    }
}
