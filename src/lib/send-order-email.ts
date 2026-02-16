import { createClient } from "@supabase/supabase-js";
import { getTransporter, FROM_EMAIL } from "@/lib/email";
import { generateInvoiceNumber, renderInvoicePdfBuffer, type InvoiceOrderRow } from "@/lib/invoice-pdf";

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

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendOrderConfirmation(orderId: string) {
  try {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[sendOrderConfirmation] SMTP disabled — skipping order email");
    return;
  }

  const supabase = getServiceRoleSupabase();

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,user_id,created_at,payment_status,total_amount,full_name,phone,address_line1,address_line2,city,state,postal_code,country,order_items(quantity,price,products(title))",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error("[sendOrderConfirmation] Order fetch error:", orderError.message);
    return;
  }

  if (!orderData) {
    console.error("[sendOrderConfirmation] Order not found:", orderId);
    return;
  }

  const order: InvoiceOrderRow = {
    id: String((orderData as any).id),
    user_id: String((orderData as any).user_id),
    created_at: String((orderData as any).created_at),
    payment_status: String((orderData as any).payment_status),
    total_amount: Number((orderData as any).total_amount ?? 0),
    full_name: ((orderData as any).full_name ?? null) as string | null,
    phone: ((orderData as any).phone ?? null) as string | null,
    address_line1: ((orderData as any).address_line1 ?? null) as string | null,
    address_line2: ((orderData as any).address_line2 ?? null) as string | null,
    city: ((orderData as any).city ?? null) as string | null,
    state: ((orderData as any).state ?? null) as string | null,
    postal_code: ((orderData as any).postal_code ?? null) as string | null,
    country: ((orderData as any).country ?? null) as string | null,
    order_items: Array.isArray((orderData as any).order_items)
      ? (orderData as any).order_items.map((i: any) => ({
          quantity: Number(i.quantity ?? 0),
          price: Number(i.price ?? 0),
          products: i.products ?? null,
        }))
      : [],
  };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", order.user_id)
    .maybeSingle<{ email: string | null }>();

  if (profileError) {
    console.error("[sendOrderConfirmation] Profile fetch error:", profileError.message);
    return;
  }

  const toEmail = String(profile?.email ?? "").trim();
  if (!toEmail) {
    console.error("[sendOrderConfirmation] Missing customer email for order:", orderId);
    return;
  }

  const { data: existingInvoice, error: existingInvoiceError } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("order_id", order.id)
    .maybeSingle<{ invoice_number: string }>();

  if (existingInvoiceError) {
    console.error("[sendOrderConfirmation] Invoice fetch error:", existingInvoiceError.message);
    return;
  }

  const invoiceNumber = existingInvoice?.invoice_number
    ? String(existingInvoice.invoice_number)
    : await generateInvoiceNumber({ supabase });

  const pdfBuffer = await renderInvoicePdfBuffer({ invoiceNumber, order });

  const addressLines = [
    order.full_name,
    order.phone,
    order.address_line1,
    order.address_line2,
    [order.city, order.state, order.postal_code].filter(Boolean).join(" "),
    order.country,
  ].filter(Boolean) as string[];

  const itemsRows = (order.order_items ?? [])
    .map((item) => {
      const productRel = item.products;
      const product = Array.isArray(productRel) ? productRel[0] : productRel;
      const title = escapeHtml(String(product?.title ?? "Item"));
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const total = qty * price;
      return `<tr><td style=\"padding:8px;border-bottom:1px solid #eee;\">${title}</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right;\">${qty}</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right;\">${price.toFixed(2)}</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right;\">${total.toFixed(2)}</td></tr>`;
    })
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin:0 0 8px 0;">Your Order is Confirmed — Vinnys Vogue</h2>
    <p style="margin:0 0 16px 0;">Thank you for shopping with us. Your payment has been received and your order is confirmed.</p>

    <p style="margin:0 0 8px 0;"><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>

    <h3 style="margin:16px 0 8px 0;">Items</h3>
    <table style="border-collapse:collapse;width:100%;max-width:640px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Item</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Qty</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Price</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <p style="margin:16px 0 0 0;"><strong>Total:</strong> ${order.total_amount.toFixed(2)}</p>

    <h3 style="margin:16px 0 8px 0;">Shipping Address</h3>
    <p style="margin:0;white-space:pre-line;">${escapeHtml(addressLines.length ? addressLines.join("\n") : "—")}</p>

    <p style="margin:24px 0 0 0;color:#666;font-size:12px;">© Vinnys Vogue — Where fashion meets elegance</p>
  </div>
  `;

  await transporter.sendMail({
    to: toEmail,
    from: FROM_EMAIL || process.env.SMTP_USER || toEmail,
    subject: "Your Order is Confirmed — Vinnys Vogue",
    html,
    attachments: [
      {
        filename: `invoice-${order.id.slice(0, 8)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  } catch (err) {
    console.error("[sendOrderConfirmation] Failed:", err);
  }
}
