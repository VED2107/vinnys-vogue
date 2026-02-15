import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    type StoryItem,
    type CollectionsContent,
} from "@/lib/site-defaults";
import { saveSiteContent } from "./actions";
import { ImageUploadInput } from "@/components/admin/image-upload-input";

export default async function AdminHomepagePage({
    searchParams,
}: {
    searchParams: { saved?: string };
}) {
    const supabase = createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?redirect=/admin/homepage");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
    if (!profile || profile.role !== "admin") redirect("/");

    // ── Fetch current content with safe fallbacks ──
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
    const stories: StoryItem[] = [0, 1, 2].map(
        (i) => ({ ...DEFAULT_STORIES.stories[i], ...(storiesData.stories[i] ?? {}) })
    );

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

    const saved = searchParams.saved === "1";

    const inputClass =
        "w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-[14px] text-heading outline-none transition focus:border-gold";
    const textareaClass = `${inputClass} resize-y min-h-[100px]`;
    const labelClass = "block text-[13px] font-medium text-heading mb-1.5";
    const saveBtn = "h-10 rounded-full bg-[#1C3A2A] px-6 text-[13px] font-medium text-white transition-all duration-300 hover:bg-[#162E22] hover:shadow-[0_4px_16px_rgba(28,58,42,0.25)]";

    return (
        <div className="min-h-screen bg-bg-admin">
            <div className="mx-auto w-full max-w-[800px] px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <a href="/admin" className="text-[13px] text-muted hover:text-heading transition">
                        ← Back to Dashboard
                    </a>
                    <h1 className="mt-2 font-serif text-[clamp(24px,3vw,36px)] font-light tracking-[-0.02em] text-heading">
                        Homepage Content
                    </h1>
                    <p className="mt-1 text-[14px] text-muted">
                        Edit hero, stories, craftsmanship images, and newsletter.
                    </p>
                </div>

                {saved ? (
                    <div className="mb-8 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-[14px] text-green-800">
                        ✓ Content saved successfully. Changes are live on the homepage.
                    </div>
                ) : null}

                {/* ─── 1. HERO ─── */}
                <form action={saveSiteContent} className="mb-10">
                    <input type="hidden" name="key" value="hero" />
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3A2A]/10 text-[#1C3A2A] text-[14px] font-bold">1</div>
                            <h2 className="font-serif text-xl font-light text-heading">Hero Section</h2>
                        </div>

                        <div>
                            <label className={labelClass}>Heading</label>
                            <input name="field_heading" defaultValue={hero.heading} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Highlight Word <span className="text-muted font-normal">(gold italic)</span></label>
                            <input name="field_highlight" defaultValue={hero.highlight} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Subtext</label>
                            <textarea name="field_subtext" defaultValue={hero.subtext} className={textareaClass} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Primary Button Text</label>
                                <input name="field_cta_primary" defaultValue={hero.cta_primary} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Secondary Button Text</label>
                                <input name="field_cta_secondary" defaultValue={hero.cta_secondary} className={inputClass} />
                            </div>
                        </div>
                        <ImageUploadInput
                            name="field_image_url"
                            defaultValue={hero.image_url}
                            label="Hero Image"
                            sublabel="public URL or upload"
                        />
                        <button type="submit" className={saveBtn}>Save Hero</button>
                    </div>
                </form>

                {/* ─── 2. STORIES (3 sections) ─── */}
                <form action={saveSiteContent} className="mb-10">
                    <input type="hidden" name="key" value="stories" />
                    <input type="hidden" name="field__is_stories" value="true" />
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3A2A]/10 text-[#1C3A2A] text-[14px] font-bold">2</div>
                            <h2 className="font-serif text-xl font-light text-heading">Story Sections <span className="text-muted font-sans text-[13px] font-normal">(3 alternating image + text)</span></h2>
                        </div>

                        {stories.map((story, i) => (
                            <div key={i} className="space-y-4 border-t border-[rgba(0,0,0,0.04)] pt-6 first:border-0 first:pt-0">
                                <div className="text-[13px] font-semibold text-gold uppercase tracking-wider">
                                    Story {i + 1} — {i % 2 === 0 ? "Image Right" : "Image Left"}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Label</label>
                                        <input name={`field_story_${i}_label`} defaultValue={story.label} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Highlight Word</label>
                                        <input name={`field_story_${i}_highlight`} defaultValue={story.highlight} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input name={`field_story_${i}_title`} defaultValue={story.title} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Paragraph 1</label>
                                    <textarea name={`field_story_${i}_paragraph_1`} defaultValue={story.paragraph_1} className={textareaClass} rows={2} />
                                </div>
                                <div>
                                    <label className={labelClass}>Paragraph 2</label>
                                    <textarea name={`field_story_${i}_paragraph_2`} defaultValue={story.paragraph_2} className={textareaClass} rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Button Text</label>
                                        <input name={`field_story_${i}_cta_text`} defaultValue={story.cta_text} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Button Link</label>
                                        <input name={`field_story_${i}_cta_href`} defaultValue={story.cta_href} className={inputClass} />
                                    </div>
                                </div>
                                <ImageUploadInput
                                    name={`field_story_${i}_image_url`}
                                    defaultValue={story.image_url}
                                    label="Image"
                                    sublabel="public URL or upload"
                                />
                            </div>
                        ))}

                        <button type="submit" className={saveBtn}>Save All Stories</button>
                    </div>
                </form>

                {/* ─── 3. CRAFTSMANSHIP — 3 staggered images ─── */}
                <form action={saveSiteContent} className="mb-10">
                    <input type="hidden" name="key" value="craftsmanship" />
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3A2A]/10 text-[#1C3A2A] text-[14px] font-bold">3</div>
                            <h2 className="font-serif text-xl font-light text-heading">Craftsmanship / Our Story</h2>
                        </div>

                        <div>
                            <label className={labelClass}>Subtitle <span className="text-muted font-normal">(gold label)</span></label>
                            <input name="field_subtitle" defaultValue={craft.subtitle} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Title</label>
                            <input name="field_title" defaultValue={craft.title} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Paragraph 1</label>
                            <textarea name="field_paragraph_1" defaultValue={craft.paragraph_1} className={textareaClass} rows={3} />
                        </div>
                        <div>
                            <label className={labelClass}>Paragraph 2</label>
                            <textarea name="field_paragraph_2" defaultValue={craft.paragraph_2} className={textareaClass} rows={3} />
                        </div>

                        <div className="border-t border-[rgba(0,0,0,0.04)] pt-5 mt-4">
                            <div className="text-[13px] font-semibold text-gold uppercase tracking-wider mb-4">3 Staggered Images (collage layout)</div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <ImageUploadInput
                                    name="field_image_url_1"
                                    defaultValue={craft.image_url_1}
                                    label="Image 1"
                                    sublabel="tall left"
                                />
                                <ImageUploadInput
                                    name="field_image_url_2"
                                    defaultValue={craft.image_url_2}
                                    label="Image 2"
                                    sublabel="top right"
                                />
                                <ImageUploadInput
                                    name="field_image_url_3"
                                    defaultValue={craft.image_url_3}
                                    label="Image 3"
                                    sublabel="bottom right"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>CTA Link Text</label>
                            <input name="field_cta_text" defaultValue={craft.cta_text} className={inputClass} />
                        </div>
                        <button type="submit" className={saveBtn}>Save Craftsmanship</button>
                    </div>
                </form>

                {/* ─── 4. NEWSLETTER ─── */}
                <form action={saveSiteContent} className="mb-10">
                    <input type="hidden" name="key" value="newsletter" />
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3A2A]/10 text-[#1C3A2A] text-[14px] font-bold">4</div>
                            <h2 className="font-serif text-xl font-light text-heading">Newsletter Section</h2>
                        </div>

                        <div>
                            <label className={labelClass}>Title</label>
                            <input name="field_title" defaultValue={newsletter.title} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea name="field_description" defaultValue={newsletter.description} className={textareaClass} rows={2} />
                        </div>
                        <button type="submit" className={saveBtn}>Save Newsletter</button>
                    </div>
                </form>

                {/* ─── 5. COLLECTION IMAGES ─── */}
                <form action={saveSiteContent} className="mb-10">
                    <input type="hidden" name="key" value="collections" />
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white p-6 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C3A2A]/10 text-[#1C3A2A] text-[14px] font-bold">5</div>
                            <h2 className="font-serif text-xl font-light text-heading">Collection Category Images</h2>
                        </div>
                        <p className="text-[13px] text-muted">Set images for each category card on the homepage. Paste a URL or upload from your device.</p>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <ImageUploadInput name="field_bridal_image" defaultValue={collections.bridal_image} label="Bridal" />
                            <ImageUploadInput name="field_festive_image" defaultValue={collections.festive_image} label="Festive" />
                            <ImageUploadInput name="field_haldi_image" defaultValue={collections.haldi_image} label="Haldi" />
                            <ImageUploadInput name="field_reception_image" defaultValue={collections.reception_image} label="Reception" />
                            <ImageUploadInput name="field_mehendi_image" defaultValue={collections.mehendi_image} label="Mehendi Ceremony" />
                            <ImageUploadInput name="field_sangeet_image" defaultValue={collections.sangeet_image} label="Sangeet" />
                        </div>
                        <button type="submit" className={saveBtn}>Save Collection Images</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
