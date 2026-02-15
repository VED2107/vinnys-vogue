import PDFDocument from "pdfkit";

export type InvoiceOrderItemRow = {
  quantity: number;
  price: number;
  products: { title: string } | { title: string }[] | null;
};

export type InvoiceOrderRow = {
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
  order_items: InvoiceOrderItemRow[];
};

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

export async function generateInvoiceNumber(params: {
  supabase: {
    from: (table: string) => any;
  };
}) {
  const { supabase } = params;
  const year = new Date().getFullYear();
  const prefix = `VIN-${year}-`;

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .like("invoice_number", `${prefix}%`);

  const next = (count ?? 0) + 1;
  return `${prefix}${pad4(next)}`;
}

export function renderInvoicePdfBuffer(params: {
  invoiceNumber: string;
  order: InvoiceOrderRow;
}) {
  const { invoiceNumber, order } = params;

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("Vinnys Vogue", { align: "left" }).moveDown(0.5);

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
