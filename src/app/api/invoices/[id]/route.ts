export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateInvoiceNumber,
  renderInvoicePdfBuffer,
  type InvoiceOrderRow,
} from "@/lib/invoice-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = String(params.id || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,user_id,created_at,payment_status,total_amount,full_name,phone,address_line1,address_line2,city,state,postal_code,country,order_items(quantity,price,products(title))",
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error("/api/invoices/[id] order query error:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const raw = orderData as any;

    const order: InvoiceOrderRow = {
      id: String(raw.id),
      user_id: String(raw.user_id),
      created_at: String(raw.created_at),
      payment_status: String(raw.payment_status),
      total_amount: Number(raw.total_amount ?? 0),
      full_name: raw.full_name ?? null,
      phone: raw.phone ?? null,
      address_line1: raw.address_line1 ?? null,
      address_line2: raw.address_line2 ?? null,
      city: raw.city ?? null,
      state: raw.state ?? null,
      postal_code: raw.postal_code ?? null,
      country: raw.country ?? null,
      order_items: Array.isArray(raw.order_items)
        ? raw.order_items.map((i: any) => ({
            quantity: Number(i.quantity ?? 0),
            price: Number(i.price ?? 0),
            products: i.products ?? null,
          }))
        : [],
    };

    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("order_id", orderId)
      .maybeSingle<{ invoice_number: string }>();

    const invoiceNumber = existingInvoice?.invoice_number
      ? String(existingInvoice.invoice_number)
      : await generateInvoiceNumber({ supabase });

    const pdfBuffer = await renderInvoicePdfBuffer({ invoiceNumber, order });

    if (!existingInvoice) {
      await supabase
        .from("invoices")
        .upsert(
          { order_id: order.id, invoice_number: invoiceNumber, pdf_url: "" },
          { onConflict: "order_id" },
        )
        .then(({ error }) => {
          if (error) console.error("Invoice upsert error:", error);
        });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${orderId.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("/api/invoices/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
