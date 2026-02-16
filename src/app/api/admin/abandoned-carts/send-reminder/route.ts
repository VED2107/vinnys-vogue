export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getTransporter, FROM_EMAIL } from "@/lib/email";

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

    // Get cart items for the email
    const { data: cartItems } = await admin
      .from("cart_items")
      .select("quantity, products(title, price_cents)")
      .eq("cart_id", cart_id);

    const items = (cartItems ?? []) as unknown as {
      quantity: number;
      products: { title: string; price_cents: number } | null;
    }[];

    const itemListHtml = items
      .map((i) => {
        const title = i.products?.title ?? "Product";
        const price = ((i.products?.price_cents ?? 0) / 100).toFixed(2);
        return `<li>${title} × ${i.quantity} — ₹${price}</li>`;
      })
      .join("");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vinnysvogue.in";

    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 500 });
    }

    try {
      await transporter.sendMail({
        to: email,
        from: FROM_EMAIL,
        subject: "You left something behind — Vinnys Vogue",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
            <h2 style="font-size:20px;margin-bottom:16px">Your cart is waiting</h2>
            <p>You have items in your cart that you haven't checked out yet:</p>
            <ul style="padding-left:20px;margin:16px 0">${itemListHtml}</ul>
            <p>Complete your purchase before they're gone!</p>
            <a href="${siteUrl}/cart"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1C1A18;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">
              Return to Cart
            </a>
            <p style="margin-top:24px;font-size:12px;color:#888">
              If you no longer wish to purchase these items, you can ignore this email.
            </p>
          </div>
        `,
      });

      await admin.from("abandoned_cart_email_logs").insert({
        cart_id,
        user_id,
        email,
        status: "sent",
      });

      return NextResponse.json({ success: true });
    } catch (emailErr) {
      await admin.from("abandoned_cart_email_logs").insert({
        cart_id,
        user_id,
        email,
        status: "failed",
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });

      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error("/api/admin/abandoned-carts/send-reminder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
