"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Upsert a site_content row by key.
 * Uses session client (NOT service role) — RLS checks apply.
 * Handles both flat fields (field_heading) and indexed story fields (field_story_0_title).
 */
export async function saveSiteContent(formData: FormData) {
    const supabase = createSupabaseServerClient();

    // ── Auth + admin check ──
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirect=/admin/homepage");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") redirect("/");

    // ── Parse form ──
    const key = formData.get("key") as string;
    if (!key) throw new Error("Missing content key");

    const isStories = formData.get("field__is_stories") === "true";

    let value: Record<string, unknown>;

    if (isStories) {
        // Parse indexed story fields: field_story_0_title → stories[0].title
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
        // Flat key-value fields
        value = {};
        for (const [name, val] of formData.entries()) {
            if (name.startsWith("field_") && !name.startsWith("field__")) {
                (value as Record<string, string>)[name.replace("field_", "")] = val as string;
            }
        }
    }

    // ── Upsert ──
    const { error } = await supabase.from("site_content").upsert(
        {
            key,
            value,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
    );

    if (error) throw new Error(`Failed to save: ${error.message}`);

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    redirect("/admin/homepage?saved=1");
}
