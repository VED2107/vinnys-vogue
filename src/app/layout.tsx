import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vinnys Vogue — Luxury Bridal Couture",
    template: "%s | Vinnys Vogue",
  },
  description:
    "Premium Indian bridal couture. Hand-embroidered silhouettes crafted for the moments you will remember forever.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinnysvogue.com",
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Vinnys Vogue",
    title: "Vinnys Vogue — Luxury Bridal Couture",
    description:
      "Premium Indian bridal couture. Hand-embroidered silhouettes crafted for the moments you will remember forever.",
    images: [
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Vinnys Vogue — Luxury Bridal Couture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vinnys Vogue — Luxury Bridal Couture",
    description:
      "Premium Indian bridal couture. Hand-embroidered silhouettes crafted for the moments you will remember forever.",
    images: ["/og-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
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
        <Header />
        <div className="animate-fadeIn">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}

