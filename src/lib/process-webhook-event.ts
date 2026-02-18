import { createClient } from "@supabase/supabase-js";
import { notifyCriticalAlert } from "@/lib/notify-alert";
import { sendOrderConfirmation } from "@/lib/send-order-email";

type WebhookEventRow = {
  id: string;
  razorpay_order_id: string | null;
  payload: unknown;
  retry_count: number | null;
  created_at?: string | null;
};

type MonitoringInsert = {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metadata?: unknown;
};

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

export async function processWebhookEvent(webhookEventId: string) {
  const supabase = getServiceRoleSupabase();

  const { data: webhookEvent, error: fetchWebhookEventError } = await supabase
    .from("webhook_events")
    .select("id, razorpay_order_id, payload, retry_count, created_at")
    .eq("id", webhookEventId)
    .maybeSingle<WebhookEventRow>();

  if (fetchWebhookEventError || !webhookEvent) {
    console.error("processWebhookEvent: webhook event fetch failed", {
      webhookEventId,
      error: fetchWebhookEventError,
    });
    return;
  }

  const evt = webhookEvent.payload as {
    id?: unknown;
    event?: unknown;
    payload?: { payment?: { entity?: { id?: unknown; order_id?: unknown } } };
  };

  const eventName = typeof evt.event === "string" ? evt.event : "";
  const paymentEntity = evt.payload?.payment?.entity;
  const razorpayOrderId =
    paymentEntity && typeof paymentEntity.order_id === "string"
      ? paymentEntity.order_id
      : webhookEvent.razorpay_order_id;

  if (!razorpayOrderId) {
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        retry_count: (webhookEvent.retry_count ?? 0) + 1,
        last_error: "Missing razorpay_order_id",
      })
      .eq("id", webhookEventId);
    return;
  }

  try {
    const { data: order, error: fetchOrderError } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle<{ id: string; payment_status: string }>();

    if (fetchOrderError || !order) {
      throw new Error(fetchOrderError?.message ?? `No order for ${razorpayOrderId}`);
    }

    if (order.payment_status === "paid") {
      await supabase
        .from("webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", webhookEventId);
      return;
    }

    if (eventName === "payment.failed") {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);

      await supabase
        .from("webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", webhookEventId);
      return;
    }

    if (eventName !== "payment.captured") {
      await supabase
        .from("webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", webhookEventId);
      return;
    }

    const razorpayPaymentId =
      paymentEntity && typeof paymentEntity.id === "string" ? paymentEntity.id : "unknown";

    const { error: rpcError } = await supabase.rpc("confirm_order_payment", {
      p_order_id: order.id,
      p_razorpay_payment_id: razorpayPaymentId,
    });

    if (rpcError) {
      await notifyCriticalAlert("confirm_order_payment RPC failed", {
        webhookEventId,
        orderId: order.id,
        razorpayOrderId,
        error: rpcError,
      });
      throw new Error(rpcError.message);
    }

    try {
      await sendOrderConfirmation(order.id);
      await supabase.from("order_email_logs").insert({
        order_id: order.id,
        status: "sent",
      });
    } catch (emailErr) {
      await supabase.from("order_email_logs").insert({
        order_id: order.id,
        status: "failed",
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    const latencyMs = (() => {
      const createdAt = webhookEvent.created_at;
      if (!createdAt) return null;
      const started = new Date(createdAt).getTime();
      if (!Number.isFinite(started)) return null;
      return Date.now() - started;
    })();

    await supabase
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        latency_ms: latencyMs,
      })
      .eq("id", webhookEventId);
  } catch (err) {
    const newRetryCount = (webhookEvent.retry_count ?? 0) + 1;
    const status = newRetryCount > 5 ? "failed" : "pending";

    if (newRetryCount >= 3) {
      const last_error = err instanceof Error ? err.message : String(err);
      const severity: MonitoringInsert["severity"] = newRetryCount > 5 ? "critical" : "warning";

      const { error: monitoringError } = await supabase
        .from("monitoring_events")
        .insert({
          type: "webhook_retry_warning",
          severity,
          message: "Webhook retry threshold reached",
          metadata: {
            webhookEventId,
            retry_count: newRetryCount,
            last_error,
          },
        } satisfies MonitoringInsert);

      if (monitoringError) {
        console.error("processWebhookEvent: failed to write monitoring_events", {
          webhookEventId,
          monitoringError,
        });
      }
    }

    if (newRetryCount >= 5) {
      await notifyCriticalAlert("Webhook processing retry threshold reached", {
        webhookEventId,
        retry_count: newRetryCount,
        last_error: err instanceof Error ? err.message : String(err),
      });
    }

    await supabase
      .from("webhook_events")
      .update({
        status,
        retry_count: newRetryCount,
        last_error: err instanceof Error ? err.message : String(err),
      })
      .eq("id", webhookEventId);
  }
}
