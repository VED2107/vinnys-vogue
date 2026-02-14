export const revalidate = 60; // ISR: re-generate every 60 seconds

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

  // Category image map for collection cards
  const categoryImages: Record<string, string> = {
    bridal: collections.bridal_image,
    festive: collections.festive_image,
    haldi: collections.haldi_image,
    reception: collections.reception_image,
    mehendi: collections.mehendi_image,
    sangeet: collections.sangeet_image,
  };

  // ── Highlight word rendering ──
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

  // ── Image placeholder helper ──
  const ImageOrPlaceholder = ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    src ? (
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 33vw" className={`object-cover ${className ?? ""}`} />
    ) : (
      <div className="flex h-full items-center justify-center bg-[#EDE8E0]">
        <div className="text-center opacity-30">
          <div className="font-serif text-sm font-light text-heading">{alt}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ——— 1. HERO ——— */}
      <CinematicReveal delay={0}>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(198,167,86,0.06) 0%, rgba(220,160,140,0.10) 40%, rgba(244,239,232,0) 100%)",
            }}
          />
          <div className="relative mx-auto w-full max-w-[1280px] px-6 py-32 md:py-40">
            <HeroReveal className="mx-auto max-w-3xl text-center">
              <HeroItem>
                <h1
                  className="font-serif font-light tracking-[-0.02em] leading-[1.1] text-heading"
                  style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
                >
                  {renderHighlight(hero.heading, hero.highlight)}
                </h1>
              </HeroItem>
              <HeroItem>
                <p className="mx-auto mt-6 max-w-lg text-[15px] leading-[1.7] text-muted">
                  {hero.subtext}
                </p>
              </HeroItem>
              <HeroItem>
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <PremiumButton href="/products">
                    {hero.cta_primary}
                  </PremiumButton>
                  <GoldOutlineButton href="/about">
                    {hero.cta_secondary}
                  </GoldOutlineButton>
                </div>
              </HeroItem>
            </HeroReveal>
          </div>
        </section>
      </CinematicReveal>

      <main className="mx-auto w-full max-w-[1280px] px-6">
        {/* ——— 2. CURATED COLLECTIONS — 6 cards ——— */}
        <CinematicReveal delay={150}>
          <section className="py-24">
            <FadeIn>
              <h2 className="text-center font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                Curated Collections
              </h2>
            </FadeIn>

            <StaggerGrid className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6" stagger={0.1}>
              {PRODUCT_CATEGORIES.map((c) => {
                const imgSrc = categoryImages[c.value];
                return (
                  <StaggerItem key={c.value}>
                    <a
                      href={`/products?category=${encodeURIComponent(c.value)}`}
                      className="group relative block overflow-hidden rounded-2xl bg-[#EDE8E0] aspect-[3/4] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.02] hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
                    >
                      {imgSrc ? (
                        <Image src={imgSrc} alt={c.label} fill sizes="(max-width: 640px) 50vw, 16vw" className="img-matte object-cover" />
                      ) : null}
                      <div className="glass-overlay pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A18]/50 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5">
                        <div className="font-serif text-lg font-light text-white tracking-[-0.01em]">
                          {c.label}
                        </div>
                      </div>
                    </a>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </section>
        </CinematicReveal>

        {/* ——— 3. STORY SECTIONS — 3 alternating image + text ——— */}
        <CinematicReveal delay={250}>
          <section className="py-12">
            {storiesData.stories.map((story, i) => (
              <FadeIn key={i}>
                <div
                  className={`grid grid-cols-1 gap-12 md:gap-16 md:grid-cols-2 items-center py-16 md:py-24 ${i > 0 ? "border-t border-[rgba(0,0,0,0.04)]" : ""
                    }`}
                >
                  {/* Image — alternates left/right */}
                  <div
                    className={`relative overflow-hidden rounded-2xl aspect-[4/5] bg-[#EDE8E0] ${i % 2 === 1 ? "md:order-2" : ""
                      }`}
                  >
                    <ImageOrPlaceholder src={story.image_url} alt={story.title} />
                  </div>

                  {/* Text content */}
                  <div className={`space-y-6 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                    <div className="text-[11px] font-medium tracking-[0.25em] text-gold uppercase">
                      {story.label}
                    </div>
                    <h2 className="font-serif text-[clamp(28px,4vw,46px)] font-light tracking-[-0.02em] leading-[1.1] text-heading">
                      {renderHighlight(story.title, story.highlight)}
                    </h2>
                    <div className="space-y-4 text-[15px] leading-[1.7] text-muted">
                      <p>{story.paragraph_1}</p>
                      <p>{story.paragraph_2}</p>
                    </div>
                    <a
                      href={story.cta_href}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1C3A2A] px-6 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:bg-[#162E22] hover:shadow-[0_4px_16px_rgba(28,58,42,0.25)]"
                    >
                      {story.cta_text}
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </section>
        </CinematicReveal>

        {/* ——— 4. LATEST ARRIVALS ——— */}
        <section className="py-24">
          <FadeIn>
            <SectionTitle
              subtitle="New In"
              title="Latest Arrivals"
              description="Discover our newest couture creations."
            />
          </FadeIn>
          <div className="mt-14">
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <FeaturedProducts />
            </Suspense>
          </div>
        </section>

        {/* ——— 5. CRAFTSMANSHIP — text left + 3 staggered images right ——— */}
        <CinematicReveal delay={350}>
          <section id="craftsmanship" className="py-24">
            <FadeIn>
              <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-[1fr_1.2fr] items-start">
                {/* Left: Text */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gold text-lg">✦</span>
                    <div className="text-[11px] font-semibold tracking-[0.25em] text-gold uppercase">
                      {craft.subtitle}
                    </div>
                  </div>
                  <h2 className="font-serif text-[clamp(28px,4vw,42px)] font-light tracking-[-0.02em] leading-[1.15] text-heading">
                    {craft.title}
                  </h2>
                  <div className="w-10 h-[2px] bg-gold opacity-60" />
                  <div className="space-y-4 text-[15px] leading-[1.7] text-muted">
                    <p>{craft.paragraph_1}</p>
                    <p>{craft.paragraph_2}</p>
                  </div>
                  <a
                    href="/about"
                    className="inline-flex items-center gap-2 text-[14px] font-medium text-gold transition-colors hover:text-gold-hover"
                  >
                    {craft.cta_text}
                  </a>
                </div>

                {/* Right: 3 staggered images collage */}
                <div className="relative grid grid-cols-2 gap-4" style={{ minHeight: "520px" }}>
                  {/* Image 1 — tall left */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] row-span-2" style={{ marginTop: "60px" }}>
                    <ImageOrPlaceholder src={craft.image_url_1} alt="Craftsmanship 1" />
                  </div>
                  {/* Image 2 — top right (shorter) */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] aspect-[3/4]">
                    <ImageOrPlaceholder src={craft.image_url_2} alt="Craftsmanship 2" />
                  </div>
                  {/* Image 3 — bottom right (shorter) */}
                  <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] aspect-[3/4]">
                    <ImageOrPlaceholder src={craft.image_url_3} alt="Craftsmanship 3" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>
        </CinematicReveal>

        {/* ——— 6. NEWSLETTER — green Subscribe button ——— */}
        <CinematicReveal delay={450}>
          <section className="py-16">
            <FadeIn>
              <div className="mx-auto max-w-xl rounded-2xl border border-[rgba(0,0,0,0.06)] bg-bg-card p-10 text-center">
                <h3 className="font-serif text-2xl font-light text-heading tracking-[-0.02em]">
                  {newsletter.title}
                </h3>
                <p className="mt-3 text-[14px] text-muted">
                  {newsletter.description}
                </p>
                <div className="mt-6 flex gap-3">
                  <NewsletterForm />
                </div>
              </div>
            </FadeIn>
          </section>
        </CinematicReveal>
      </main>
    </div>
  );
}
