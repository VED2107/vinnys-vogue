import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExportOrderRow = {
    id: string;
    created_at: string;
    full_name: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    total_amount: number;
    status: string;
};

function escapeCSV(value: string | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function formatINR(amount: number): string {
    return `INR ${Number(amount).toFixed(2)}`;
}

export async function GET(request: NextRequest) {
    const supabase = createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
        .from("orders")
        .select(
            "id, created_at, full_name, phone, address_line1, address_line2, city, state, postal_code, country, total_amount, status",
        )
        .order("created_at", { ascending: false });

    if (from) {
        query = query.gte("created_at", `${from}T00:00:00`);
    }
    if (to) {
        query = query.lte("created_at", `${to}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const orders = (data ?? []) as ExportOrderRow[];

    const header = [
        "Order ID",
        "Created At",
        "Full Name",
        "Phone",
        "Address Line1",
        "Address Line2",
        "City",
        "State",
        "Postal Code",
        "Country",
        "Total (INR)",
        "Status",
    ].join(",");

    const rows = orders.map((o) =>
        [
            escapeCSV(o.id),
            escapeCSV(o.created_at),
            escapeCSV(o.full_name),
            escapeCSV(o.phone),
            escapeCSV(o.address_line1),
            escapeCSV(o.address_line2),
            escapeCSV(o.city),
            escapeCSV(o.state),
            escapeCSV(o.postal_code),
            escapeCSV(o.country),
            escapeCSV(formatINR(o.total_amount)),
            escapeCSV(o.status),
        ].join(","),
    );

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="orders.csv"',
        },
    });
}
