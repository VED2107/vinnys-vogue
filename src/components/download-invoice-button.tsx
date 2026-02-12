"use client";

import { useCallback, useState, useTransition } from "react";

type Props = {
  orderId: string;
};

export default function DownloadInvoiceButton({ orderId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onClick = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/invoice/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ orderId }),
        });

        const json = (await res.json()) as { url?: string; error?: string };

        if (!res.ok || !json.url) {
          setError(json.error ?? "Failed to generate invoice.");
          return;
        }

        globalThis.location.href = json.url;
      } catch {
        setError("Failed to generate invoice.");
      }
    });
  }, [orderId]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={`inline-flex h-11 items-center rounded-2xl px-6 text-sm font-medium text-white shadow-sm transition ${
          isPending ? "bg-zinc-400" : "bg-zinc-900 hover:bg-zinc-800"
        }`}
      >
        Download Invoice
      </button>
      {error ? <div className="text-sm text-red-700">{error}</div> : null}
    </div>
  );
}
