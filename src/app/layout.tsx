import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollHeader } from "@/components/scroll-header";
import { GoldenBackground } from "@/components/golden-background";
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

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
      >
        <GoldenBackground />
        <ScrollHeader>
          <Header />
        </ScrollHeader>
        <div className="animate-fadeIn">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}

