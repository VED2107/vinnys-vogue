export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET() {
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

    const admin = getServiceRoleSupabase();

    const [pendingRes, failedRes, alertsRes, systemStateRes] = await Promise.all([
      admin
        .from("webhook_events")
        .select("id, razorpay_order_id, status, retry_count, last_error, created_at, processed_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(200),
      admin
        .from("webhook_events")
        .select("id, razorpay_order_id, status, retry_count, last_error, created_at, processed_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("monitoring_events")
        .select("id, type, severity, message, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("system_state")
        .select("key, value, updated_at")
        .eq("key", "last_reconcile_run")
        .maybeSingle(),
    ]);

    if (pendingRes.error) {
      return NextResponse.json({ error: pendingRes.error.message }, { status: 500 });
    }
    if (failedRes.error) {
      return NextResponse.json({ error: failedRes.error.message }, { status: 500 });
    }
    if (alertsRes.error) {
      return NextResponse.json({ error: alertsRes.error.message }, { status: 500 });
    }

    const pending = pendingRes.data ?? [];
    const failed = failedRes.data ?? [];
    const alerts = alertsRes.data ?? [];

    const avgRetry = pending.length
      ? pending.reduce((sum, e: any) => sum + (Number(e.retry_count) || 0), 0) / pending.length
      : 0;

    const oldestPendingCreatedAt = pending.length ? pending[0]?.created_at ?? null : null;

    const retryDistribution: Record<string, number> = {};
    for (const e of [...pending, ...failed]) {
      const k = String((e as any).retry_count ?? 0);
      retryDistribution[k] = (retryDistribution[k] ?? 0) + 1;
    }

    return NextResponse.json({
      pending,
      failed,
      alerts,
      metrics: {
        pendingCount: pending.length,
        failedCount: failed.length,
        avgRetry,
        oldestPendingCreatedAt,
        retryDistribution,
      },
      lastReconcileRun: systemStateRes.data?.value ?? null,
      lastReconcileUpdatedAt: systemStateRes.data?.updated_at ?? null,
    });
  } catch (err) {
    console.error("/api/admin/reliability error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
