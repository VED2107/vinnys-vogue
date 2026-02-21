import { createClient } from "@supabase/supabase-js";
import { sendResendEmail } from "@/lib/email";
import { buildEmailLayout, escapeHtml } from "@/lib/emailTemplates";
import {
  generateInvoiceNumber,
  renderInvoicePdfBuffer,
  type InvoiceOrderRow,
} from "@/lib/invoice-pdf";

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

export async function sendOrderConfirmation(orderId: string) {
  try {
    const supabase = getServiceRoleSupabase();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,user_id,created_at,payment_status,total_amount,razorpay_payment_id,full_name,phone,address_line1,address_line2,city,state,postal_code,country,order_items(quantity,price,products(title))",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      console.error("[sendOrderConfirmation] Order fetch error:", orderError?.message ?? "not found");
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle<{ email: string | null }>();

    const toEmail = String(profile?.email ?? "").trim();
    if (!toEmail) {
      console.error("[sendOrderConfirmation] Missing customer email for order:", orderId);
      return;
    }

    // Invoice number
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("order_id", order.id)
      .maybeSingle<{ invoice_number: string }>();

    const invoiceNumber = existingInvoice?.invoice_number
      ? String(existingInvoice.invoice_number)
      : await generateInvoiceNumber({ supabase });

    // If no existing invoice record, create one
    if (!existingInvoice) {
      await supabase.from("invoices").insert({
        order_id: order.id,
        invoice_number: invoiceNumber,
      });
    }

    // Build items table
    const itemsRows = (order.order_items ?? [])
      .map((item) => {
        const productRel = item.products;
        const product = Array.isArray(productRel) ? productRel[0] : productRel;
        const title = escapeHtml(String(product?.title ?? "Item"));
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const total = qty * price;
        return `<tr>
          <td style="padding:8px 4px;border-bottom:1px solid #333;font-size:13px;color:#ccc;">${title}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:center;font-size:13px;color:#ccc;">${qty}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹${price.toFixed(2)}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #333;text-align:right;font-size:13px;color:#ccc;">₹${total.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    // Address block
    const addressLines = [
      order.full_name,
      order.phone,
      order.address_line1,
      order.address_line2,
      [order.city, order.state, order.postal_code].filter(Boolean).join(", "),
      order.country,
    ].filter(Boolean) as string[];

    const paymentId = (orderData as any).razorpay_payment_id ?? "—";

    const bodyHtml = `
      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Order ID</p>
      <p style="margin:0 0 16px 0;font-size:15px;font-weight:600;color:#ccc;">${escapeHtml(order.id)}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#2a2a2a;">
            <th style="padding:8px 4px;text-align:left;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Item</th>
            <th style="padding:8px 4px;text-align:center;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Qty</th>
            <th style="padding:8px 4px;text-align:right;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Price</th>
            <th style="padding:8px 4px;text-align:right;font-size:12px;font-weight:600;color:#1C3A2A;border-bottom:2px solid #1C3A2A;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px 4px 0 4px;text-align:right;font-size:14px;font-weight:700;color:#1C3A2A;">Total</td>
            <td style="padding:10px 4px 0 4px;text-align:right;font-size:14px;font-weight:700;color:#1C3A2A;">₹${order.total_amount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Shipping Address</p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#ccc;white-space:pre-line;">${escapeHtml(addressLines.length ? addressLines.join("\n") : "—")}</p>

      <p style="margin:0 0 4px 0;font-size:13px;color:#999;">Payment ID</p>
      <p style="margin:0;font-size:13px;color:#ccc;">${escapeHtml(String(paymentId))}</p>
    `;

    const html = buildEmailLayout({
      title: "Your Order is Confirmed ✨",
      bodyHtml,
      footerNote: "Thank you for shopping with us. Your invoice is attached to this email.",
    });

    // Generate PDF — if it fails, send email without attachment
    let attachments: { filename: string; content: string }[] | undefined;
    try {
      const pdfBuffer = await renderInvoicePdfBuffer({ invoiceNumber, order });
      attachments = [
        {
          filename: `invoice-${order.id.slice(0, 8)}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ];
    } catch (pdfErr) {
      console.error("[sendOrderConfirmation] Invoice PDF failed — sending without attachment:", pdfErr);
    }

    await sendResendEmail(
      {
        to: toEmail,
        from: "support@vinnysvogue.in",
        subject: "Your Order is Confirmed — Vinnys Vogue",
        html,
        attachments,
      },
      "order_confirmation",
    );
  } catch (err) {
    console.error("[sendOrderConfirmation] Failed:", err);
  }
}
