import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";
import { MandalaBackground } from "@/components/decorative";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/");

  const cards = [
    { title: "Homepage Content", description: "Edit hero, story, and newsletter sections.", href: "/admin/homepage", action: "Edit", primary: true },
    { title: "Manage Products", description: "Edit, toggle active status, and manage inventory.", href: "/admin/products", action: "Open", primary: true },
    { title: "Add New Product", description: "Create a new listing for your boutique collection.", href: "/admin/products/new", action: "Create", primary: false },
    { title: "Orders", description: "View orders, filter by date, and export CSV.", href: "/admin/orders", action: "Open", primary: true },
    { title: "Analytics", description: "Revenue, order stats, and payment insights.", href: "/admin/analytics", action: "View", primary: false },
    { title: "Reliability", description: "Webhook queue health, retries, and reconciliation status.", href: "/admin/reliability", action: "View", primary: false },
    { title: "Reviews", description: "Moderate customer reviews — approve, reject, or delete.", href: "/admin/reviews", action: "Moderate", primary: false },
    { title: "Abandoned Carts", description: "View abandoned carts and send reminder emails.", href: "/admin/abandoned-carts", action: "View", primary: false },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-admin">
      <MandalaBackground variant="lotus" position="top-right" />
      <div className="relative z-10 w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="flex items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="gold-divider" />
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">Dashboard</div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">Admin</h1>
            </div>
            <form action="/logout" method="post">
              <button className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-6 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)]">Sign out</button>
            </form>
          </div>
        </FadeIn>

        <StaggerGrid className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8" stagger={0.08}>
          {cards.map((c, i) => (
            <StaggerItem key={c.href}>
              <a href={c.href} className="group flex h-full flex-col justify-between rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div>
                  <div className="font-serif text-[16px] font-medium text-heading leading-snug">{c.title}</div>
                  <div className="mt-2.5 text-[14px] leading-relaxed text-muted">{c.description}</div>
                </div>
                <div className="mt-6">
                  <span className={`inline-flex h-9 items-center rounded-full px-5 text-[13px] font-medium transition ${i < 4 ? "bg-[#0F2E22] text-white hover:bg-[#1C3A2A]" : "bg-gradient-to-r from-[#C6A75E] to-[#E8D4A2] text-white shadow-sm"}`}>
                    {c.action}
                  </span>
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </div>
  );
}
