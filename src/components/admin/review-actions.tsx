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

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteReview() {
    if (!confirm("Delete this review permanently?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {currentStatus !== "approved" && (
        <button
          onClick={() => updateStatus("approved")}
          disabled={loading}
          className="h-8 rounded-full bg-green-600 px-3 text-[12px] font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
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
          className="h-8 rounded-full bg-amber-600 px-3 text-[12px] font-medium text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1"
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
        className="h-8 rounded-full bg-red-600 px-3 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
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
  );
}
