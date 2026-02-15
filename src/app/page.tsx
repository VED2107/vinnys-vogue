export const revalidate = 60;

import { Suspense } from "react";
import Image from "next/image";
import {
  FeaturedProducts,
  FeaturedProductsSkeleton,
} from "@/components/featured-products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { SectionTitle, PremiumButton, GoldOutlineButton } from "@/components/ui";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/fade-in";
import { HeroReveal, HeroItem } from "@/components/hero-section";
import CinematicReveal from "@/components/CinematicReveal";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  DEFAULT_HERO,
  DEFAULT_CRAFTSMANSHIP,
  DEFAULT_NEWSLETTER,
  DEFAULT_STORIES,
  DEFAULT_COLLECTIONS,
  type HeroContent,
  type CraftsmanshipContent,
  type NewsletterContent,
  type StoriesContent,
  type CollectionsContent,
} from "@/lib/site-defaults";

export default async function Home() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Fetch editable content with safe fallbacks ──
  const { data: heroRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "hero")
    .maybeSingle();
  const hero: HeroContent = { ...DEFAULT_HERO, ...(heroRow?.value as Partial<HeroContent> | null) };

  const { data: storiesRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "stories")
    .maybeSingle();
  const storiesData: StoriesContent = {
    stories: (storiesRow?.value as StoriesContent | null)?.stories ?? DEFAULT_STORIES.stories,
  };

  const { data: craftRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "craftsmanship")
    .maybeSingle();
  const craft: CraftsmanshipContent = { ...DEFAULT_CRAFTSMANSHIP, ...(craftRow?.value as Partial<CraftsmanshipContent> | null) };

  const { data: newsRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "newsletter")
    .maybeSingle();
  const newsletter: NewsletterContent = { ...DEFAULT_NEWSLETTER, ...(newsRow?.value as Partial<NewsletterContent> | null) };

  const { data: collectionsRow } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", "collections")
    .maybeSingle();
  const collections: CollectionsContent = { ...DEFAULT_COLLECTIONS, ...(collectionsRow?.value as Partial<CollectionsContent> | null) };

  const categoryImages: Record<string, string> = {
    bridal: collections.bridal_image,
    festive: collections.festive_image,
    haldi: collections.haldi_image,
    reception: collections.reception_image,
    mehendi: collections.mehendi_image,
    sangeet: collections.sangeet_image,
  };

  const renderHighlight = (text: string, highlight: string) => {
    if (!highlight || !text.includes(highlight)) return text;
    const parts = text.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-gold italic">{highlight}</span>
        {parts.slice(1).join(highlight)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ——— 1. HERO — Balanced Split ——— */}
      <section className="w-full py-28 lg:py-32 px-6 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-20">
          {/* Left — Text */}
          <div>
            <div>
              <h1 className="font-serif leading-[1.1] text-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 4.5rem)' }}>
                {renderHighlight(hero.heading, hero.highlight)}
              </h1>
              <p className="mt-6 text-neutral-600 leading-relaxed" style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1.125rem)' }}>
                {hero.subtext}
              </p>
              <div className="mt-8 flex gap-4">
                <PremiumButton href="/products">
                  {hero.cta_primary}
                </PremiumButton>
                <GoldOutlineButton href="/about">
                  {hero.cta_secondary}
                </GoldOutlineButton>
              </div>
            </div>
          </div>

          {/* Right — Image */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#EDE8E0]">
            <Image
              src={hero.image_url || "/og-banner.jpg"}
              alt="Luxury couture"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover img-matte"
              priority
            />
          </div>
        </div>
      </section>

      {/* ——— 2. CURATED COLLECTIONS ——— */}
      <CinematicReveal delay={100}>
        <section className="w-full py-28 px-6 lg:px-16 xl:px-24">
          <FadeIn>
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-medium">
                Curated
              </p>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl font-light text-heading">
                Collections
              </h2>
            </div>
          </FadeIn>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12" stagger={0.08}>
            {PRODUCT_CATEGORIES.map((c) => {
              const imgSrc = categoryImages[c.value];
              return (
                <StaggerItem key={c.value}>
                  <a
                    href={`/products?category=${encodeURIComponent(c.value)}`}
                    className="group relative block overflow-hidden rounded-xl bg-[#EDE8E0] aspect-[4/5]"
                  >
                    {imgSrc ? (
                      <Image src={imgSrc} alt={c.label} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="img-matte object-cover" />
                    ) : null}
                    <div className="glass-overlay pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5">
                      <span className="font-serif text-base font-light text-white tracking-wide">
                        {c.label}
                      </span>
                    </div>
                  </a>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        </section>
      </CinematicReveal>

      {/* ——— 3. EDITORIAL STORIES ——— */}
      {storiesData.stories.map((story, i) => (
        <CinematicReveal key={i} delay={150 + i * 100}>
          <section className="w-full py-28 px-6 lg:px-16 xl:px-24">
            <div className={`grid lg:grid-cols-2 items-center gap-16 lg:gap-24 ${i % 2 === 1 ? "direction-rtl" : ""}`}>
              {/* Image */}
              <div className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-[#EDE8E0] ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                {story.image_url ? (
                  <Image src={story.image_url} alt={story.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="img-matte object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-neutral-400 font-light">{story.title}</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="max-w-[480px]">
                  <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-medium">
                    {story.label}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl lg:text-4xl font-light leading-[1.15] text-heading">
                    {renderHighlight(story.title, story.highlight)}
                  </h2>
                  <div className="mt-5 space-y-3 text-[15px] leading-[1.7] text-neutral-600">
                    <p>{story.paragraph_1}</p>
                    <p>{story.paragraph_2}</p>
                  </div>
                  <a
                    href={story.cta_href}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1C3A2A] px-7 py-2.5 text-[12px] tracking-[0.15em] uppercase font-light text-white transition-all duration-300 btn-luxury"
                  >
                    {story.cta_text}
                  </a>
                </div>
              </div>
            </div>
          </section>
        </CinematicReveal>
      ))}

      {/* ——— 4. LATEST ARRIVALS ——— */}
      <CinematicReveal delay={300}>
        <section className="w-full py-28 px-6 lg:px-16 xl:px-24">
          <FadeIn>
            <div className="mb-12">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-medium">
                New In
              </p>
              <h2 className="mt-2 font-serif text-3xl lg:text-4xl font-light text-heading">
                Latest Arrivals
              </h2>
            </div>
          </FadeIn>
          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedProducts />
          </Suspense>
        </section>
      </CinematicReveal>

      {/* ——— 5. CRAFTSMANSHIP ——— */}
      <CinematicReveal delay={350}>
        <section id="craftsmanship" className="w-full py-28 px-6 lg:px-16 xl:px-24">
          <div className="grid lg:grid-cols-2 items-center gap-16 lg:gap-24">
            {/* Text */}
            <div>
              <div className="max-w-[480px]">
                <div className="flex items-center gap-2">
                  <span className="text-gold text-sm">✦</span>
                  <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-semibold">
                    {craft.subtitle}
                  </p>
                </div>
                <h2 className="mt-3 font-serif text-3xl lg:text-4xl font-light leading-[1.15] text-heading">
                  {craft.title}
                </h2>
                <div className="mt-5 w-10 h-[1px] bg-gold opacity-60" />
                <div className="mt-5 space-y-3 text-[15px] leading-[1.7] text-neutral-600">
                  <p>{craft.paragraph_1}</p>
                  <p>{craft.paragraph_2}</p>
                </div>
                <a
                  href="/about"
                  className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-gold transition-opacity hover:opacity-70"
                >
                  {craft.cta_text} →
                </a>
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0] row-span-2">
                {craft.image_url_1 ? (
                  <Image src={craft.image_url_1} alt="Craftsmanship" fill sizes="25vw" className="img-matte object-cover" />
                ) : null}
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0]">
                {craft.image_url_2 ? (
                  <Image src={craft.image_url_2} alt="Detail" fill sizes="25vw" className="img-matte object-cover" />
                ) : null}
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EDE8E0]">
                {craft.image_url_3 ? (
                  <Image src={craft.image_url_3} alt="Artistry" fill sizes="25vw" className="img-matte object-cover" />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </CinematicReveal>

      {/* ——— 6. NEWSLETTER ——— */}
      <CinematicReveal delay={400}>
        <section className="w-full py-28 px-6 lg:px-16 xl:px-24">
          <FadeIn>
            <div className="max-w-[520px] mx-auto text-center">
              <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-medium">
                Stay Connected
              </p>
              <h3 className="mt-2 font-serif text-2xl lg:text-3xl font-light text-heading">
                {newsletter.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.7] text-neutral-600">
                {newsletter.description}
              </p>
              <div className="mt-6 flex justify-center">
                <NewsletterForm />
              </div>
            </div>
          </FadeIn>
        </section>
      </CinematicReveal>
    </div>
  );
}
