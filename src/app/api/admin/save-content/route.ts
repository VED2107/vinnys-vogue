import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * API Route replacement for saveSiteContent Server Action.
 * Bypasses Next.js origin check that fails through proxy previews.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient();

        // Auth + admin check
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse form data
        const formData = await req.formData();
        const key = formData.get("key") as string;
        if (!key) {
            return NextResponse.json({ error: "Missing content key" }, { status: 400 });
        }

        const isStories = formData.get("field__is_stories") === "true";

        let value: Record<string, unknown>;

        if (isStories) {
            const stories: Record<string, string>[] = [{}, {}, {}];
            for (const [name, val] of formData.entries()) {
                const match = name.match(/^field_story_(\d)_(.+)$/);
                if (match) {
                    const idx = parseInt(match[1], 10);
                    const field = match[2];
                    if (idx >= 0 && idx < 3) {
                        stories[idx][field] = val as string;
                    }
                }
            }
            value = { stories };
        } else {
            value = {};
            for (const [name, val] of formData.entries()) {
                if (name.startsWith("field_") && !name.startsWith("field__")) {
                    (value as Record<string, string>)[name.replace("field_", "")] = val as string;
                }
            }
        }

        // Upsert
        const { error } = await supabase.from("site_content").upsert(
            {
                key,
                value,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
        );

        if (error) {
            console.error("[save-content] Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidatePath("/");
        revalidatePath("/admin/homepage");

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[save-content] Unhandled error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Save failed" },
            { status: 500 }
        );
    }
}
