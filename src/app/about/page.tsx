import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    DEFAULT_CRAFTSMANSHIP,
    type CraftsmanshipContent,
} from "@/lib/site-defaults";
import { FadeIn } from "@/components/fade-in";

export default async function AboutPage() {
    const supabase = createSupabaseServerClient();

    const { data: craftRow } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "craftsmanship")
        .maybeSingle();
    const craft: CraftsmanshipContent = {
        ...DEFAULT_CRAFTSMANSHIP,
        ...(craftRow?.value as Partial<CraftsmanshipContent> | null),
    };

    const ImageOrPlaceholder = ({ src, alt }: { src: string; alt: string }) =>
        src ? (
            <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
            <div className="flex h-full items-center justify-center bg-[#EDE8E0]">
                <div className="text-center opacity-30">
                    <div className="font-serif text-sm font-light text-heading">{alt}</div>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-bg-primary">
            <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:py-28">
                {/* Title */}
                <FadeIn>
                    <div className="text-center space-y-6 mb-16">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-gold text-lg">✦</span>
                            <div className="text-[11px] font-semibold tracking-[0.25em] text-gold uppercase">
                                {craft.subtitle}
                            </div>
                        </div>
                        <h1 className="font-serif text-[clamp(32px,5vw,56px)] font-light tracking-[-0.02em] leading-[1.1] text-heading">
                            {craft.title}
                        </h1>
                        <div className="mx-auto w-10 h-[2px] bg-gold opacity-60" />
                    </div>
                </FadeIn>

                {/* Content: text left + 3 staggered images right */}
                <FadeIn>
                    <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-[1fr_1.2fr] items-start">
                        {/* Text */}
                        <div className="space-y-6">
                            <div className="space-y-4 text-[15px] leading-[1.8] text-muted">
                                <p>{craft.paragraph_1}</p>
                                <p>{craft.paragraph_2}</p>
                            </div>
                            <a
                                href="/products"
                                className="inline-flex items-center gap-2 text-[14px] font-medium text-gold transition-colors hover:text-gold-hover"
                            >
                                {craft.cta_text}
                            </a>
                        </div>

                        {/* 3 staggered images */}
                        <div className="relative grid grid-cols-2 gap-4" style={{ minHeight: "480px" }}>
                            <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] row-span-2" style={{ marginTop: "40px" }}>
                                <ImageOrPlaceholder src={craft.image_url_1} alt="Artisan Detail 1" />
                            </div>
                            <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] aspect-[3/4]">
                                <ImageOrPlaceholder src={craft.image_url_2} alt="Artisan Detail 2" />
                            </div>
                            <div className="relative overflow-hidden rounded-2xl bg-[#EDE8E0] aspect-[3/4]">
                                <ImageOrPlaceholder src={craft.image_url_3} alt="Artisan Detail 3" />
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
