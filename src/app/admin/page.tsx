import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";

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
  ];

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
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

        <StaggerGrid className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {cards.map((c) => (
            <StaggerItem key={c.href}>
              <a href={c.href} className="group block rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
                <div className="font-serif text-[15px] font-medium text-heading">{c.title}</div>
                <div className="mt-2 text-[14px] text-muted">{c.description}</div>
                <div className={`mt-5 inline-flex h-9 items-center rounded-full px-5 text-[13px] font-medium transition ${c.primary ? "bg-accent text-white" : "border border-[rgba(0,0,0,0.1)] text-heading hover:border-[rgba(0,0,0,0.2)]"}`}>
                  {c.action}
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </div>
  );
}
