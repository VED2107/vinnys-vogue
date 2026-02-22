import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollHeader } from "@/components/scroll-header";
import { GoldenBackground } from "@/components/golden-background";
import { PageTransition } from "@/components/page-transition";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.vinnysvogue.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: "Vinnys Vogue — Luxury Bridal Couture in India",
  description:
    "Discover handcrafted bridal lehengas and couture for modern Indian brides.",

  openGraph: {
    title: "Vinnys Vogue — Luxury Bridal Couture",
    description:
      "Handcrafted bridal couture for modern Indian brides.",
    url: siteUrl,
    siteName: "Vinnys Vogue",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Vinnys Vogue Bridal Couture",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    images: ["/og-banner.jpg"],
  },

  manifest: "/manifest.json",

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased relative`}
        suppressHydrationWarning
      >
        <GoldenBackground />
        <ScrollHeader>
          <Header />
        </ScrollHeader>
        <PageTransition>
          {children}
        </PageTransition>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}

