export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyCriticalAlert } from "@/lib/notify-alert";
import { sendOrderCancellationEmail } from "@/lib/send-cancellation-email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = String(params.id || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,user_id,status,payment_status,shipped_at")
      .eq("id", orderId)
      .maybeSingle<{
        id: string;
        user_id: string;
        status: string;
        payment_status: string;
        shipped_at: string | null;
      }>();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const canCancel =
      order.payment_status === "paid" &&
      order.status === "confirmed" &&
      order.shipped_at == null;

    if (!canCancel) {
      return NextResponse.json(
        {
          error:
            "Order cannot be cancelled. Only confirmed, paid, unshipped orders can be cancelled.",
        },
        { status: 400 },
      );
    }

    const { error: rpcError } = await supabase.rpc("restore_order_stock", {
      p_order_id: orderId,
      p_user_id: user.id,
    });

    if (rpcError) {
      await notifyCriticalAlert("restore_order_stock RPC failed", {
        orderId,
        error: rpcError,
      });
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    try {
      await sendOrderCancellationEmail(orderId);
    } catch (emailErr) {
      await notifyCriticalAlert("Order cancellation email failed", {
        orderId,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/orders/[id]/cancel error:", err);
    await notifyCriticalAlert("Cancel order route fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
