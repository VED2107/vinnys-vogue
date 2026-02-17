import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import { MandalaBackground } from "@/components/decorative";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?redirect=/admin");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") redirect("/");

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="flex min-h-screen">
                {/* Left sidebar */}
                <AdminSidebar />

                {/* Right content area */}
                <main className="relative flex-1 overflow-hidden">
                    <MandalaBackground variant="lotus" position="center" />
                    <div className="relative z-10 w-full px-6 lg:px-12 xl:px-16 py-8 lg:py-12 pb-28 md:pb-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
