"use client";

import { useState, useTransition } from "react";

export default function DownloadInvoiceButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/invoices/${orderId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: "Download failed" }));
          setError(json.error || "Download failed");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${orderId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        setError("Something went wrong.");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={`inline-flex h-12 items-center rounded-full px-8 text-[14px] font-medium tracking-wide transition-all duration-400 gap-2 ${isPending ? "border border-[rgba(0,0,0,0.08)] bg-bg-card text-muted opacity-60" : "border border-gold text-gold hover:bg-gold hover:text-white"
          }`}
      >
        {isPending && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {isPending ? "Downloading…" : "Download Invoice"}
      </button>
      {error ? <div className="text-[13px] text-red-700">{error}</div> : null}
    </div>
  );
}
