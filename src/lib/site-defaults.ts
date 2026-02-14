/**
 * Safe fallback defaults for each site_content key.
 * Used when the DB row is missing or value is null.
 * Extend this file to add new keys without schema changes.
 *
 * Supported keys: hero, stories, craftsmanship, newsletter
 * Future keys: seo, footer, announcement_bar, homepage_collections, brand_story, faq
 */

export interface HeroContent {
    heading: string;
    highlight: string;
    subtext: string;
    cta_primary: string;
    cta_secondary: string;
}

export interface StoryItem {
    label: string;
    title: string;
    highlight: string;
    paragraph_1: string;
    paragraph_2: string;
    cta_text: string;
    cta_href: string;
    image_url: string;
}

export interface StoriesContent {
    stories: StoryItem[];
}

export interface CraftsmanshipContent {
    subtitle: string;
    title: string;
    paragraph_1: string;
    paragraph_2: string;
    cta_text: string;
    image_url_1: string;
    image_url_2: string;
    image_url_3: string;
}

export interface NewsletterContent {
    title: string;
    description: string;
}

export const DEFAULT_HERO: HeroContent = {
    heading: "Where Dreams Meet Couture",
    highlight: "Couture",
    subtext:
        "Exquisite Indian bridal and festive couture crafted for your most treasured moments",
    cta_primary: "Explore Collections →",
    cta_secondary: "Our Story",
};

export const DEFAULT_STORIES: StoriesContent = {
    stories: [
        {
            label: "01 / Festive Collection",
            title: "Festive Grace",
            highlight: "Grace",
            paragraph_1:
                "Celebrate life's joyous moments in our festive collection. Vibrant hues meet delicate embellishments, creating ensembles that capture the spirit of Indian celebrations.",
            paragraph_2:
                "From intimate gatherings to grand festivities, each piece is designed to make you the centre of attention while honouring timeless traditions.",
            cta_text: "Explore Festive →",
            cta_href: "/products?category=festive",
            image_url: "",
        },
        {
            label: "02 / Reception Collection",
            title: "Reception Elegance",
            highlight: "Elegance",
            paragraph_1:
                "Step into the spotlight with our reception collection. Contemporary silhouettes merge with traditional craftsmanship, creating statement pieces for the modern bride.",
            paragraph_2:
                "Subtle shimmer, refined embroidery, and flowing fabrics come together to create looks that are both regal and effortlessly chic.",
            cta_text: "Explore Reception →",
            cta_href: "/products?category=reception",
            image_url: "",
        },
        {
            label: "03 / Bridal Collection",
            title: "Bridal Dreams",
            highlight: "Dreams",
            paragraph_1:
                "Our bridal collection embodies the essence of Indian weddings — grandeur, grace, and timeless beauty. Each lehenga is a labour of love, handcrafted over weeks by master artisans.",
            paragraph_2:
                "Rich fabrics adorned with intricate zardozi, resham, and kundan work create ethereal silhouettes worthy of your most cherished day.",
            cta_text: "Explore Bridal →",
            cta_href: "/products?category=bridal",
            image_url: "",
        },
    ],
};

export const DEFAULT_CRAFTSMANSHIP: CraftsmanshipContent = {
    subtitle: "Craftsmanship",
    title: "Where Heritage Meets Modern Elegance",
    paragraph_1:
        "Every piece at Vinnys Vogue is a masterpiece, meticulously crafted by India's finest artisans. Our collections celebrate centuries-old techniques while embracing contemporary design sensibilities.",
    paragraph_2:
        "From hand-embroidered zardozi to delicate chikankari, each ensemble tells a story of dedication, passion, and unparalleled artistry.",
    cta_text: "Discover Our Story →",
    image_url_1: "",
    image_url_2: "",
    image_url_3: "",
};

export const DEFAULT_NEWSLETTER: NewsletterContent = {
    title: "Join Our Exclusive Circle",
    description:
        "Be the first to discover new collections and receive styling inspiration.",
};

export interface CollectionsContent {
    bridal_image: string;
    festive_image: string;
    haldi_image: string;
    reception_image: string;
    mehendi_image: string;
    sangeet_image: string;
}

export const DEFAULT_COLLECTIONS: CollectionsContent = {
    bridal_image: "",
    festive_image: "",
    haldi_image: "",
    reception_image: "",
    mehendi_image: "",
    sangeet_image: "",
};
