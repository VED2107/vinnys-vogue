"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReviewActions({
  reviewId,
  currentStatus,
}: {
  reviewId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to update status");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function deleteReview() {
    if (!confirm("Delete this review permanently?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to delete review");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <div className="flex items-center gap-2">
        {currentStatus !== "approved" && (
          <button
            onClick={() => updateStatus("approved")}
            disabled={loading}
            className="h-8 rounded-full bg-green-600 px-3 text-[12px] font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 transition"
          >
            {loading && (
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            Approve
          </button>
        )}
        {currentStatus !== "rejected" && (
          <button
            onClick={() => updateStatus("rejected")}
            disabled={loading}
            className="h-8 rounded-full bg-amber-600 px-3 text-[12px] font-medium text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1 transition"
          >
            {loading && (
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            Reject
          </button>
        )}
        <button
          onClick={deleteReview}
          disabled={loading}
          className="h-8 rounded-full bg-red-600 px-3 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 transition"
        >
          {loading && (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          Delete
        </button>
      </div>
      {error && (
        <div className="text-[11px] text-red-600 font-medium">{error}</div>
      )}
    </div>
  );
}
