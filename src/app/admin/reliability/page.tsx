import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FadeIn } from "@/components/fade-in";

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

type WebhookEventRow = {
  id: string;
  razorpay_order_id: string | null;
  status: string;
  retry_count: number | null;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
};

type MonitoringRow = {
  id: string;
  type: string;
  severity: string;
  message: string;
  metadata: unknown;
  created_at: string;
};

export default async function AdminReliabilityPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin/reliability");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/");

  const admin = getServiceRoleSupabase();

  const [pendingRes, failedRes, alertsRes, stateRes] = await Promise.all([
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
      .maybeSingle<{ key: string; value: any; updated_at: string }>(),
  ]);

  const pending = (pendingRes.data ?? []) as WebhookEventRow[];
  const failed = (failedRes.data ?? []) as WebhookEventRow[];
  const alerts = (alertsRes.data ?? []) as MonitoringRow[];

  const oldestPending = pending.length ? pending[0] : null;
  const avgRetry = pending.length
    ? pending.reduce((s, e) => s + (e.retry_count ?? 0), 0) / pending.length
    : 0;

  const retryDist: Record<string, number> = {};
  for (const e of [...pending, ...failed]) {
    const k = String(e.retry_count ?? 0);
    retryDist[k] = (retryDist[k] ?? 0) + 1;
  }

  const lastReconcileTs: string | null = stateRes.data?.value?.timestamp ?? null;
  const lastReconcileLabel = lastReconcileTs
    ? new Date(lastReconcileTs).toLocaleString("en-IN")
    : "—";

  return (
    <div className="min-h-screen bg-bg-admin">
      <div className="w-full px-6 lg:px-16 xl:px-24 py-16">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="gold-divider" />
              <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                Reliability
              </div>
              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                Resilience Panel
              </h1>
              <p className="text-[15px] text-muted">
                Pending: {pending.length} • Failed: {failed.length} • Avg retry: {avgRetry.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin"
                className="h-10 rounded-full border border-[rgba(0,0,0,0.1)] px-5 text-[14px] text-heading transition hover:border-[rgba(0,0,0,0.2)] inline-flex items-center"
              >
                Back
              </a>
            </div>
          </div>
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-md">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Webhook Health</div>
            <div className="mt-4 space-y-2 text-[14px] text-heading">
              <div>Pending count: <span className="font-medium">{pending.length}</span></div>
              <div>Failed count: <span className="font-medium">{failed.length}</span></div>
              <div>Avg retry_count (pending): <span className="font-medium">{avgRetry.toFixed(2)}</span></div>
              <div>Oldest pending: <span className="font-medium">{oldestPending ? new Date(oldestPending.created_at).toLocaleString("en-IN") : "—"}</span></div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-md">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Retry Distribution</div>
            <div className="mt-4 space-y-2 text-[14px] text-heading">
              {Object.keys(retryDist).length === 0 ? (
                <div className="text-muted">No data.</div>
              ) : (
                Object.entries(retryDist)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <div>retry_count = {k}</div>
                      <div className="font-medium">{v}</div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-md">
            <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Reconciliation</div>
            <div className="mt-4 space-y-2 text-[14px] text-heading">
              <div>Last reconcile run: <span className="font-medium">{lastReconcileLabel}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white shadow-md overflow-hidden">
            <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Pending Webhooks</div>
            </div>
            {pending.length === 0 ? (
              <div className="px-6 py-10 text-[14px] text-muted">No pending events.</div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                {pending.slice(0, 25).map((e) => (
                  <div key={e.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-mono text-[13px] text-heading">{e.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-[13px] text-muted">retry: {e.retry_count ?? 0}</div>
                    </div>
                    <div className="mt-1 text-[13px] text-muted">{e.razorpay_order_id ?? "—"}</div>
                    {e.last_error ? (
                      <div className="mt-1 text-[12px] text-red-700">{e.last_error}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white shadow-md overflow-hidden">
            <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Monitoring Events</div>
            </div>
            {alerts.length === 0 ? (
              <div className="px-6 py-10 text-[14px] text-muted">No events.</div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                {alerts.map((a) => (
                  <div key={a.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[13px] font-medium text-heading">{a.type}</div>
                      <div className="text-[12px] text-muted">{new Date(a.created_at).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="mt-1 text-[13px] text-muted">{a.message}</div>
                    <div className="mt-1 text-[12px] text-muted">severity: {a.severity}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(pendingRes.error || failedRes.error || alertsRes.error || stateRes.error) ? (
          <div className="mt-6 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-6 text-[14px] text-red-700">
            {(pendingRes.error?.message || failedRes.error?.message || alertsRes.error?.message || stateRes.error?.message) ?? "Unknown error"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
