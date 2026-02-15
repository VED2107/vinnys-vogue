import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SITE_IMAGE_BUCKET = "product-images";

export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient();

        // Auth check
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const folder = String(formData.get("folder") || "site").trim();

        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
        }

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
        }

        const ext = file.name.includes(".")
            ? file.name.split(".").pop()!.toLowerCase()
            : "jpg";
        const timestamp = Date.now();
        const uploadPath = `${folder}/${timestamp}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from(SITE_IMAGE_BUCKET)
            .upload(uploadPath, file, {
                upsert: true,
                contentType: file.type || undefined,
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(SITE_IMAGE_BUCKET)
            .getPublicUrl(uploadPath);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (err) {
        console.error("[upload/site-image] Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Upload failed" },
            { status: 500 }
        );
    }
}
