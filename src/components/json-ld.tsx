/**
 * JSON-LD structured data components for SEO.
 * Outputs <script type="application/ld+json"> tags that search engines consume.
 */

/* ---------- Organisation / WebSite (homepage) ---------- */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vinnys Vogue",
    url: "https://vinnysvogue.com",
    logo: "https://vinnysvogue.com/logo.png",
    sameAs: [
      "https://www.instagram.com/vinnysvogue",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vinnys Vogue",
    url: "https://vinnysvogue.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://vinnysvogue.com/products?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ---------- Product page ---------- */
export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency,
  availability,
  url,
  ratingValue,
  reviewCount,
}: {
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock";
  url: string;
  ratingValue?: number;
  reviewCount?: number;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    ...(image && { image }),
    offers: {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  if (ratingValue && reviewCount && reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ---------- Breadcrumb ---------- */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
