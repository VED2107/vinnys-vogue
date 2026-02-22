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

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams?: { status?: string; page?: string };
}) {
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

  const activeTab = searchParams?.status ?? "all";
  const currentPage = Math.max(1, parseInt(searchParams?.page ?? "1", 10));
  const pageSize = 50;

  let query = supabase
    .from("reviews")
    .select(
      "id, product_id, user_id, rating, review_text, is_verified, status, created_at, products(title), profiles(email)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (activeTab !== "all") {
    query = query.eq("status", activeTab);
  }

  const from = (currentPage - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data: reviews, error, count } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-bg-admin">
        <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
          <div className="rounded-[20px] border border-red-200 bg-red-50 p-8 text-center">
            <div className="text-[15px] font-medium text-red-800">
              Failed to load reviews
            </div>
            <div className="mt-2 text-[13px] text-red-600">{error.message}</div>
            <a
              href="/admin/reviews"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-red-600 px-5 text-[13px] font-medium text-white hover:bg-red-700 transition"
            >
              Retry
            </a>
          </div>
        </div>
      </div>
    );
  }

  const rows = (reviews ?? []) as unknown as ReviewRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                Moderation
              </div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                Reviews
              </h1>
              <p className="text-[15px] text-muted">
                {totalCount} review{totalCount !== 1 ? "s" : ""}
                {activeTab !== "all" ? ` · ${activeTab}` : ""}
              </p>
            </div>
            <a
              href="/admin"
              className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center"
            >
              Back
            </a>
          </div>
        </FadeIn>

        {/* Status Filter Tabs */}
        <FadeIn delay={0.05}>
          <div className="mt-8 flex gap-2">
            {STATUS_TABS.map((tab) => (
              <a
                key={tab.key}
                href={
                  tab.key === "all"
                    ? "/admin/reviews"
                    : `/admin/reviews?status=${tab.key}`
                }
                className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition ${activeTab === tab.key
                    ? "bg-accent text-white"
                    : "border border-[rgba(0,0,0,0.08)] text-muted hover:border-[rgba(0,0,0,0.16)]"
                  }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-8 overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white">
            {rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-neutral-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
                <div className="mt-3 text-[15px] font-medium text-heading">
                  No reviews found
                </div>
                <div className="mt-1 text-[13px] text-muted">
                  {activeTab !== "all"
                    ? `No ${activeTab} reviews yet.`
                    : "No reviews have been submitted yet."}
                </div>
              </div>
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
                              <svg
                                key={s}
                                xmlns="http://www.w3.org/2000/svg"
                                width={12}
                                height={12}
                                viewBox="0 0 24 24"
                                fill={s <= r.rating ? "#C6A756" : "none"}
                                stroke={s <= r.rating ? "#C6A756" : "#D1D5DB"}
                                strokeWidth="1.5"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            ))}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColor[r.status] ??
                              "bg-zinc-100 text-zinc-700"
                              }`}
                          >
                            {r.status}
                          </span>
                          {r.is_verified && (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              Verified
                            </span>
                          )}
                        </div>
                        {r.review_text && (
                          <p className="mt-2 text-[13px] text-muted line-clamp-2">
                            {r.review_text}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
                          <span>{r.profiles?.email ?? "Unknown"}</span>
                          <span>
                            {new Date(r.created_at).toLocaleDateString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </div>
                      <AdminReviewActions
                        reviewId={r.id}
                        currentStatus={r.status}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Pagination */}
        {totalPages > 1 && (
          <FadeIn delay={0.15}>
            <div className="mt-6 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <a
                  href={`/admin/reviews?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${currentPage - 1}`}
                  className="h-9 rounded-full border border-[rgba(0,0,0,0.08)] px-4 text-[13px] text-muted inline-flex items-center hover:border-[rgba(0,0,0,0.16)] transition"
                >
                  ← Previous
                </a>
              )}
              <span className="px-3 text-[13px] text-muted">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <a
                  href={`/admin/reviews?${activeTab !== "all" ? `status=${activeTab}&` : ""}page=${currentPage + 1}`}
                  className="h-9 rounded-full border border-[rgba(0,0,0,0.08)] px-4 text-[13px] text-muted inline-flex items-center hover:border-[rgba(0,0,0,0.16)] transition"
                >
                  Next →
                </a>
              )}
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
