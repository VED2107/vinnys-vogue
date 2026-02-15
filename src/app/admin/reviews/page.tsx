import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/fade-in";
import AdminReviewActions from "@/components/admin/review-actions";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  products: { title: string } | null;
  profiles: { email: string | null } | null;
};

export default async function AdminReviewsPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/reviews");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/");

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, product_id, user_id, rating, review_text, is_verified, status, created_at, products(title), profiles(email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (reviews ?? []) as unknown as ReviewRow[];

  const statusColor: Record<string, string> = {
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    pending: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="gold-divider" />
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Moderation</div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">Reviews</h1>
              <p className="text-[15px] text-muted">{rows.length} review{rows.length !== 1 ? "s" : ""}</p>
            </div>
            <a href="/admin" className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center">Back</a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white">
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-[15px] text-muted">No reviews yet.</div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                {rows.map((r) => (
                  <div key={r.id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="text-[14px] font-medium text-heading">
                            {r.products?.title ?? "Unknown Product"}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg key={s} xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill={s <= r.rating ? "#C6A756" : "none"} stroke={s <= r.rating ? "#C6A756" : "#D1D5DB"} strokeWidth="1.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColor[r.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                            {r.status}
                          </span>
                          {r.is_verified && (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">Verified</span>
                          )}
                        </div>
                        {r.review_text && (
                          <p className="mt-2 text-[13px] text-muted line-clamp-2">{r.review_text}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
                          <span>{r.profiles?.email ?? "Unknown"}</span>
                          <span>{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>
                      <AdminReviewActions reviewId={r.id} currentStatus={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
