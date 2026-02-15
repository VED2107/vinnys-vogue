export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { notifyCriticalAlert } from "@/lib/notify-alert";

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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

    if (!process.env.CRON_SECRET || auth !== expected) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = getServiceRoleSupabase();

    await supabase
      .from("system_state")
      .upsert({
        key: "last_reconcile_run",
        value: { timestamp: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      });

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, razorpay_order_id, payment_status, created_at")
      .eq("payment_status", "unpaid")
      .not("razorpay_order_id", "is", null)
      .gte("created_at", cutoff);

    if (ordersError) {
      console.error("reconcile-payments: failed to fetch orders", ordersError);
      return NextResponse.json({ ok: false, error: ordersError.message }, { status: 500 });
    }

    let checked = 0;
    let confirmed = 0;
    let errors = 0;

    for (const order of orders ?? []) {
      checked += 1;
      const razorpayOrderId = order.razorpay_order_id as string;

      try {
        const paymentsResp = await razorpay.orders.fetchPayments(razorpayOrderId);
        const items = Array.isArray((paymentsResp as any)?.items)
          ? (paymentsResp as any).items
          : [];

        const hasCaptured = items.some((p: any) => p && p.status === "captured");

        if (!hasCaptured) {
          continue;
        }

        const { error: rpcError } = await supabase.rpc("confirm_order_payment", {
          p_order_id: order.id,
        });

        if (rpcError) {
          errors += 1;
          await notifyCriticalAlert("confirm_order_payment RPC failed (reconcile)", {
            orderId: order.id,
            razorpayOrderId,
            error: rpcError,
          });
          console.error("reconcile-payments: confirm_order_payment failed", {
            orderId: order.id,
            razorpayOrderId,
            error: rpcError,
          });
          continue;
        }

        confirmed += 1;
        console.log("reconcile-payments: confirmed paid order", {
          orderId: order.id,
          razorpayOrderId,
        });
      } catch (e) {
        errors += 1;
        console.error("reconcile-payments: Razorpay fetchPayments failed", {
          orderId: order.id,
          razorpayOrderId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({ ok: true, checked, confirmed, errors });
  } catch (err) {
    await notifyCriticalAlert("reconcile-payments fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
    console.error("reconcile-payments fatal error", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
