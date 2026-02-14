import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/product-images";
import { formatMoneyFromCents } from "@/lib/format";
import { getCategoryLabel } from "@/lib/categories";
import VariantSelector from "@/components/variant-selector";
import { FadeIn } from "@/components/fade-in";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, description, price_cents, currency, image_path")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (!product) {
    return { title: "Product Not Found" };
  }

  const p = product as {
    title: string;
    description: string | null;
    price_cents: number;
    currency: string;
    image_path: string | null;
  };

  const imageUrl = p.image_path
    ? getProductImagePublicUrl(supabase, p.image_path)
    : undefined;

  const price = formatMoneyFromCents(p.price_cents, p.currency);
  const desc = p.description
    ? `${p.description.slice(0, 150)}…`
    : `Shop ${p.title} — ${price} at Vinnys Vogue.`;

  return {
    title: p.title,
    description: desc,
    openGraph: {
      title: `${p.title} — Vinnys Vogue`,
      description: desc,
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 1000, alt: p.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.title} — Vinnys Vogue`,
      description: desc,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_path: string | null;
  active: boolean;
  category: string | null;
};

type VariantRow = { id: string; size: string; stock: number };

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/product/${params.id}`);
  }

  const { data: product } = await supabase
    .from("products")
    .select("id,title,description,price_cents,currency,image_path,active,category")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();
  if (!(product as { active: boolean }).active) notFound();

  const p = product as ProductRow;
  const imageUrl = getProductImagePublicUrl(supabase, p.image_path);

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id,size,stock")
    .eq("product_id", p.id)
    .order("size", { ascending: true });

  const variantRows = (variants ?? []) as VariantRow[];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
        <FadeIn>
          <div className="grid grid-cols-1 gap-20 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[20px] bg-[#EDE8E0] aspect-[3/4]">
              <Image
                src={imageUrl}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="img-matte object-cover"
                priority
              />
            </div>

            <div className="flex flex-col justify-center space-y-8">
              {p.category ? (
                <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                  {getCategoryLabel(p.category)}
                </div>
              ) : null}

              <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                {p.title}
              </h1>

              <div className="gold-divider" />

              <div className="font-serif text-[24px] font-light text-gold">
                {formatMoneyFromCents(p.price_cents, p.currency)}
              </div>

              {p.description ? (
                <p className="text-[15px] leading-[1.7] text-muted whitespace-pre-line">
                  {p.description}
                </p>
              ) : null}

              <VariantSelector
                productId={p.id}
                variants={variantRows}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
