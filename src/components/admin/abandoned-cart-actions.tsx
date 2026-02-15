"use client";

import { useState, useEffect } from "react";

type CartItem = {
  quantity: number;
  product_title: string;
  price_cents: number;
};

type AbandonedCart = {
  cart_id: string;
  user_id: string;
  email: string | null;
  created_at: string;
  item_count: number;
  items: CartItem[];
  reminder_sent: boolean;
};

export default function AbandonedCartActions() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/abandoned-carts");
        if (!res.ok) {
          setError("Failed to load abandoned carts");
          return;
        }
        const json = await res.json();
        setCarts(json.abandonedCarts ?? []);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function sendReminder(cart: AbandonedCart) {
    if (!cart.email) return;
    setSending(cart.cart_id);
    try {
      const res = await fetch("/api/admin/abandoned-carts/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_id: cart.cart_id,
          email: cart.email,
          user_id: cart.user_id,
        }),
      });

      if (res.ok) {
        setCarts((prev) =>
          prev.map((c) =>
            c.cart_id === cart.cart_id ? { ...c, reminder_sent: true } : c,
          ),
        );
      }
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-10 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-12 text-center text-[14px] text-muted">
        Loading abandoned carts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-[20px] border border-red-200 bg-red-50 p-6 text-[14px] text-red-700">
        {error}
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="mt-10 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white p-12 text-center text-[14px] text-muted">
        No abandoned carts found.
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="text-[13px] text-muted">{carts.length} abandoned cart{carts.length !== 1 ? "s" : ""} found</div>

      <div className="overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white">
        <div className="divide-y divide-[rgba(0,0,0,0.04)]">
          {carts.map((cart) => (
            <div key={cart.cart_id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-[14px] font-medium text-heading">
                      {cart.email ?? "No email"}
                    </div>
                    <span className="text-[12px] text-muted">
                      {cart.item_count} item{cart.item_count !== 1 ? "s" : ""}
                    </span>
                    {cart.reminder_sent && (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Reminder Sent
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="text-[13px] text-muted">
                        {item.product_title} × {item.quantity} — ₹{(item.price_cents / 100).toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[12px] text-muted">
                    Cart created: {new Date(cart.created_at).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {cart.email && !cart.reminder_sent ? (
                    <button
                      onClick={() => sendReminder(cart)}
                      disabled={sending === cart.cart_id}
                      className="h-9 rounded-full bg-accent px-5 text-[13px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    >
                      {sending === cart.cart_id ? "Sending..." : "Send Reminder"}
                    </button>
                  ) : cart.reminder_sent ? (
                    <span className="text-[13px] text-green-700">Sent</span>
                  ) : (
                    <span className="text-[13px] text-muted">No email</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
