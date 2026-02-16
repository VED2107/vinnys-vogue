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

    const { error: rpcError } = await supabase.rpc("cancel_order", {
      p_order_id: orderId,
    });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("already cancelled") || msg.includes("cannot be cancelled") || msg.includes("Forbidden") || msg.includes("not found")) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      await notifyCriticalAlert("cancel_order RPC failed", {
        orderId,
        error: rpcError,
      });
      return NextResponse.json({ error: msg }, { status: 500 });
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
