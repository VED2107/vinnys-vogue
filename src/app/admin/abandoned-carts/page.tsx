import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/fade-in";
import AbandonedCartActions from "@/components/admin/abandoned-cart-actions";

export const dynamic = "force-dynamic";

export default async function AdminAbandonedCartsPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/abandoned-carts");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="gold-divider" />
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Recovery</div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">Abandoned Carts</h1>
              <p className="text-[15px] text-muted">Carts older than 24h with items, no orders placed.</p>
            </div>
            <a href="/admin" className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center">Back</a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <AbandonedCartActions />
        </FadeIn>
      </div>
    </div>
  );
}
