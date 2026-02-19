"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type InventoryLogRow = {
  id: string;
  product_id: string;
  change: number;
  reason: string | null;
  created_at: string;
};

type Props = {
  productId: string;
  productTitle: string;
  currentStock: number;
};

export default function StockAdjustModal({
  productId,
  productTitle,
  currentStock,
}: Props) {
  const [open, setOpen] = useState(false);
  const [change, setChange] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [logs, setLogs] = useState<InventoryLogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    return Number.isInteger(change) && change !== 0 && reason.trim().length > 0;
  }, [change, reason]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/inventory-logs`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json()) as { logs?: InventoryLogRow[]; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to load inventory history.");
        setLogs([]);
        return;
      }
      setLogs(json.logs ?? []);
    } catch {
      setError("Failed to load inventory history.");
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!open) return;
    void loadLogs();
  }, [open, loadLogs]);

  const submit = useCallback(() => {
    if (!canSubmit) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/adjust-stock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ change, reason: reason.trim() }),
        });

        const json = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok) {
          setError(json.error ?? "Failed to adjust stock.");
          return;
        }

        setChange(0);
        setReason("");
        await loadLogs();

        globalThis.location?.reload();
      } catch {
        setError("Failed to adjust stock.");
      }
    });
  }, [canSubmit, change, loadLogs, productId, reason]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 inline-flex items-center"
      >
        Adjust
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />

          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-6 border-b border-zinc-200 px-6 py-5">
              <div className="space-y-1">
                <div className="text-sm font-medium text-zinc-900">Adjust Stock</div>
                <div className="text-xs text-zinc-500 line-clamp-1">{productTitle}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-xs text-zinc-500">Current Stock</div>
                  <div className="mt-1 text-2xl font-semibold text-zinc-900">{currentStock}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600" htmlFor={`change-${productId}`}>
                    Change (+ / -)
                  </label>
                  <input
                    id={`change-${productId}`}
                    type="number"
                    inputMode="numeric"
                    value={Number.isFinite(change) ? String(change) : "0"}
                    onChange={(e) => setChange(Number.parseInt(e.target.value || "0", 10) || 0)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChange(5)}
                      className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Restock +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setChange(10)}
                      className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Restock +10
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-600" htmlFor={`reason-${productId}`}>
                    Reason
                  </label>
                  <input
                    id={`reason-${productId}`}
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={!canSubmit || isPending}
                  onClick={submit}
                  className={`h-11 w-full rounded-xl px-4 text-sm font-medium text-white transition inline-flex items-center justify-center gap-2 ${!canSubmit || isPending ? "bg-zinc-400" : "bg-zinc-900 hover:bg-zinc-800"
                    }`}
                >
                  {isPending && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {isPending ? "Saving…" : "Save Adjustment"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-zinc-900">Stock Movement History</div>

                <div className="max-h-[360px] overflow-auto rounded-2xl border border-zinc-200">
                  {loadingLogs ? (
                    <div className="p-4 text-sm text-zinc-600">Loading…</div>
                  ) : logs.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-600">No inventory logs.</div>
                  ) : (
                    <div className="divide-y divide-zinc-200">
                      {logs.map((l) => {
                        const date = new Date(l.created_at).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <div key={l.id} className="flex items-start justify-between gap-3 p-4">
                            <div className="min-w-0">
                              <div className="text-xs text-zinc-500">{date}</div>
                              <div className="mt-1 text-sm text-zinc-900 line-clamp-2">
                                {l.reason ?? "—"}
                              </div>
                            </div>
                            <div
                              className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${l.change >= 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                                }`}
                            >
                              {l.change >= 0 ? `+${l.change}` : l.change}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
