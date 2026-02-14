export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PDFDocument from "pdfkit";

type OrderItemRow = {
  quantity: number;
  price: number;
  products: { title: string } | { title: string }[] | null;
};

type OrderRow = {
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
  order_items: OrderItemRow[];
};

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

async function generateInvoiceNumber(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const year = new Date().getFullYear();
  const prefix = `VIN-${year}-`;

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .like("invoice_number", `${prefix}%`);

  const next = (count ?? 0) + 1;
  return `${prefix}${pad4(next)}`;
}

function renderPdfBuffer(params: {
  invoiceNumber: string;
  order: OrderRow;
}) {
  const { invoiceNumber, order } = params;

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc
        .fontSize(20)
        .text("Vinnys Vogue", { align: "left" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#444444")
        .text(`Invoice: ${invoiceNumber}`)
        .text(`Order ID: ${order.id}`)
        .text(
          `Date: ${new Date(order.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}`,
        )
        .text(`Payment: ${order.payment_status}`)
        .moveDown(1);

      doc.fillColor("#000000").fontSize(12).text("Bill To", { underline: true });

      const addressParts = [
        order.full_name,
        order.phone,
        order.address_line1,
        order.address_line2,
        [order.city, order.state, order.postal_code].filter(Boolean).join(" "),
        order.country,
      ].filter(Boolean) as string[];

      doc
        .fontSize(10)
        .fillColor("#111111")
        .text(addressParts.length ? addressParts.join("\n") : "—")
        .moveDown(1);

      const tableTop = doc.y + 8;
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      const colQty = 60;
      const colPrice = 100;
      const colTotal = 100;
      const colItem = pageWidth - (colQty + colPrice + colTotal);

      const x = doc.page.margins.left;

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text("Item", x, tableTop, { width: colItem })
        .text("Qty", x + colItem, tableTop, { width: colQty, align: "right" })
        .text("Price", x + colItem + colQty, tableTop, {
          width: colPrice,
          align: "right",
        })
        .text("Total", x + colItem + colQty + colPrice, tableTop, {
          width: colTotal,
          align: "right",
        });

      doc
        .moveTo(x, tableTop + 16)
        .lineTo(x + pageWidth, tableTop + 16)
        .strokeColor("#e4e4e7")
        .stroke();

      let y = tableTop + 24;

      for (const item of order.order_items ?? []) {
        const productRel = item.products;
        const product = Array.isArray(productRel) ? productRel[0] : productRel;
        const title = product?.title ?? "Item";
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const total = qty * price;

        doc
          .fontSize(10)
          .fillColor("#111111")
          .text(title, x, y, { width: colItem })
          .text(String(qty), x + colItem, y, { width: colQty, align: "right" })
          .text(price.toFixed(2), x + colItem + colQty, y, {
            width: colPrice,
            align: "right",
          })
          .text(total.toFixed(2), x + colItem + colQty + colPrice, y, {
            width: colTotal,
            align: "right",
          });

        y += 18;
      }

      doc
        .moveTo(x, y + 6)
        .lineTo(x + pageWidth, y + 6)
        .strokeColor("#e4e4e7")
        .stroke();

      doc
        .fontSize(12)
        .fillColor("#000000")
        .text("Total", x + colItem + colQty + colPrice, y + 16, {
          width: colTotal,
          align: "right",
        })
        .text(order.total_amount.toFixed(2), x + colItem + colQty + colPrice, y + 34, {
          width: colTotal,
          align: "right",
        });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

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

    const order: OrderRow = {
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

    const invoiceNumber = await generateInvoiceNumber(supabase);
    const pdfBuffer = await renderPdfBuffer({ invoiceNumber, order });

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
