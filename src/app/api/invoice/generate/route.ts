export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateInvoiceNumber,
  renderInvoicePdfBuffer,
  type InvoiceOrderRow,
} from "@/lib/invoice-pdf";



export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { orderId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const orderId = String(body.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,user_id,created_at,payment_status,total_amount,full_name,phone,address_line1,address_line2,city,state,postal_code,country,order_items(quantity,price,products(title))",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const raw = orderData as unknown as {
      id: string;
      user_id: string;
      created_at: string;
      payment_status: string;
      total_amount: number;
      full_name: string | null;
      phone: string | null;
      address_line1: string | null;
      address_line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
      country: string | null;
      order_items: {
        quantity: number;
        price: number;
        products: { title: string } | { title: string }[] | null;
      }[];
    };

    const order: InvoiceOrderRow = {
      id: raw.id,
      user_id: raw.user_id,
      created_at: raw.created_at,
      payment_status: raw.payment_status,
      total_amount: Number(raw.total_amount ?? 0),
      full_name: raw.full_name ?? null,
      phone: raw.phone ?? null,
      address_line1: raw.address_line1 ?? null,
      address_line2: raw.address_line2 ?? null,
      city: raw.city ?? null,
      state: raw.state ?? null,
      postal_code: raw.postal_code ?? null,
      country: raw.country ?? null,
      order_items: (raw.order_items ?? []).map((i) => ({
        quantity: Number(i.quantity ?? 0),
        price: Number(i.price ?? 0),
        products: i.products ?? null,
      })),
    };

    if (!isAdmin && order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingInvoice, error: invoiceLookupError } = await supabase
      .from("invoices")
      .select("invoice_number,pdf_url")
      .eq("order_id", order.id)
      .maybeSingle();

    if (invoiceLookupError) {
      return NextResponse.json({ error: invoiceLookupError.message }, { status: 500 });
    }

    if (existingInvoice?.pdf_url) {
      const { data: signed, error: signError } = await supabase.storage
        .from("invoices")
        .createSignedUrl(String(existingInvoice.pdf_url), 60 * 10);

      if (signError || !signed?.signedUrl) {
        return NextResponse.json({ error: signError?.message ?? "Failed to sign URL" }, { status: 500 });
      }

      return NextResponse.json({ url: signed.signedUrl, invoiceNumber: existingInvoice.invoice_number });
    }

    const invoiceNumber = await generateInvoiceNumber({ supabase });
    const pdfBuffer = await renderInvoicePdfBuffer({ invoiceNumber, order });

    const storagePath = isAdmin
      ? `admin/${order.id}/${invoiceNumber}.pdf`
      : `${user.id}/${order.id}/${invoiceNumber}.pdf`;

    const upload = await supabase.storage
      .from("invoices")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const { error: upsertError } = await supabase
      .from("invoices")
      .upsert(
        {
          order_id: order.id,
          invoice_number: invoiceNumber,
          pdf_url: storagePath,
        },
        {
          onConflict: "order_id",
        },
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(storagePath, 60 * 10);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: signError?.message ?? "Failed to sign URL" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl, invoiceNumber });
  } catch (err) {
    console.error("/api/invoice/generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
