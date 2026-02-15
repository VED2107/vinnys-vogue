export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReviewRow = {
  id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  created_at: string;
  profiles: { email: string | null } | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, rating, review_text, is_verified, created_at, profiles(email)")
      .eq("product_id", params.productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (reviews ?? []) as unknown as ReviewRow[];

    const avgRating =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
        : 0;

    return NextResponse.json({
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        is_verified: r.is_verified,
        created_at: r.created_at,
        reviewer: r.profiles?.email
          ? r.profiles.email.replace(/(.{2}).*(@.*)/, "$1***$2")
          : "Anonymous",
      })),
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: rows.length,
    });
  } catch (err) {
    console.error("/api/reviews/[productId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
