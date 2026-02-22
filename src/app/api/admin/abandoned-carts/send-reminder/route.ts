export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendResendEmail, SITE_URL, EMAIL_FROM } from "@/lib/email";
import { buildEmailLayout, escapeHtml } from "@/lib/emailTemplates";

function getServiceRoleSupabase() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export async function POST(request: Request) {
  try {
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

    let body: { cart_id?: string; email?: string; user_id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { cart_id, email, user_id } = body;

    if (!cart_id || !email || !user_id) {
      return NextResponse.json(
        { error: "cart_id, email, and user_id are required" },
        { status: 400 },
      );
    }

    const admin = getServiceRoleSupabase();

    // Check if reminder already sent for this cart
    const { data: existingLog } = await admin
      .from("abandoned_cart_email_logs")
      .select("id")
      .eq("cart_id", cart_id)
      .eq("status", "sent")
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json(
        { error: "Reminder already sent for this cart" },
        { status: 409 },
      );
    }

    // Get cart items for the email
    const { data: cartItems } = await admin
      .from("cart_items")
      .select("quantity, products(title, price)")
      .eq("cart_id", cart_id);

    const items = (cartItems ?? []) as unknown as {
      quantity: number;
      products: { title: string; price: number } | null;
    }[];

    const itemListHtml = items
      .map((i) => {
        const title = escapeHtml(i.products?.title ?? "Product");
        const price = (i.products?.price ?? 0).toFixed(2);
        return `<tr>
          <td style="padding:8px 4px;border-bottom:1px solid #333;font-size:13px;color:#ccc;">${title}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:center;font-size:13px;color:#ccc;">${i.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹${price}</td>
        </tr>`;
      })
      .join("");

    const bodyHtml = `
      <p style="margin:0 0 16px 0;">You left some beautiful items in your cart. They're still waiting for you!</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#2a2a2a;">
            <th style="padding:8px 4px;text-align:left;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Item</th>
            <th style="padding:8px 4px;text-align:center;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Qty</th>
            <th style="padding:8px 4px;text-align:right;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Price</th>
          </tr>
        </thead>
        <tbody>${itemListHtml}</tbody>
      </table>
    `;

    const html = buildEmailLayout({
      title: "You Left Something Behind ✨",
      bodyHtml,
      ctaText: "Complete Your Purchase",
      ctaUrl: `${SITE_URL}/cart`,
      footerNote: "If you no longer wish to purchase these items, you can safely ignore this email.",
    });

    const sent = await sendResendEmail(
      {
        to: email,
        from: EMAIL_FROM,
        subject: "You left something behind — Vinnys Vogue",
        html,
      },
      "cart_abandonment",
    );

    await admin.from("abandoned_cart_email_logs").insert({
      cart_id,
      user_id,
      email,
      status: sent ? "sent" : "failed",
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/admin/abandoned-carts/send-reminder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
