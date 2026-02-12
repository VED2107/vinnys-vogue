import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight">Admin</h1>
            <p className="text-sm text-zinc-600">
              Products, orders, and profile management.
            </p>
          </div>
          <form action="/logout" method="post">
            <button className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <a
            href="/admin/products"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900">
                Manage Products
              </div>
              <div className="h-9 w-9 rounded-full border border-zinc-200 bg-zinc-50 transition group-hover:border-zinc-300" />
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              Edit, toggle active status, and manage inventory.
            </div>
            <div className="mt-5 inline-flex h-9 items-center rounded-xl bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition group-hover:bg-zinc-800">
              Open
            </div>
          </a>

          <a
            href="/admin/products/new"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900">
                Add New Product
              </div>
              <div className="h-9 w-9 rounded-full border border-zinc-200 bg-zinc-50 transition group-hover:border-zinc-300" />
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              Create a new listing for your boutique collection.
            </div>
            <div className="mt-5 inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition group-hover:bg-zinc-50">
              Create
            </div>
          </a>

          <a
            href="/admin/orders"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900">Orders</div>
              <div className="h-9 w-9 rounded-full border border-zinc-200 bg-zinc-50 transition group-hover:border-zinc-300" />
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              View orders, filter by date, and export CSV.
            </div>
            <div className="mt-5 inline-flex h-9 items-center rounded-xl bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition group-hover:bg-zinc-800">
              Open
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900">Analytics</div>
              <div className="h-9 w-9 rounded-full border border-zinc-200 bg-zinc-50 transition group-hover:border-zinc-300" />
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              Revenue, order stats, and payment insights.
            </div>
            <div className="mt-5 inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition group-hover:bg-zinc-50">
              View
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
