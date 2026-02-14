export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
    try {
        // Rate limit: 5 per minute
        const ip = getClientIp(request);
        const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 },
            );
        }

        let body: { email?: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const email = String(body.email || "").trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
                { status: 400 },
            );
        }

        const supabase = createSupabaseServerClient();

        // Upsert — silently ignore duplicates
        const { error } = await supabase
            .from("newsletter_subscribers")
            .upsert(
                { email },
                { onConflict: "email", ignoreDuplicates: true },
            );

        if (error) {
            console.error("Newsletter subscribe error:", error);
            return NextResponse.json(
                { error: "Something went wrong. Please try again." },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("/api/newsletter error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
