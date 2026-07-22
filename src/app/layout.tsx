import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
  Inter,
  DM_Sans,
  Manrope,
  Plus_Jakarta_Sans,
  Outfit,
  Sora,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


const SITE_TITLE = "Kroomix — Automatización e IA para tu negocio";
const SITE_DESCRIPTION =
  "Automatizamos procesos manuales, integramos tus herramientas y añadimos IA a tu operativa para que tu empresa ahorre tiempo y dinero. Pymes de Osona, Barcelona y toda España.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Kroomix",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kroomix",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "es_ES",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kroomix — Automatización e IA para tu negocio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Kroomix",
  url: SITE_URL,
  logo: `${SITE_URL}/kroomix-logo.png`,
  image: `${SITE_URL}/og-image.png`,
  description: SITE_DESCRIPTION,
  telephone: "+34626572151",
  email: "hola@kroomix.com",
  areaServed: [
    { "@type": "Place", name: "Osona" },
    { "@type": "Place", name: "Barcelona" },
    { "@type": "Country", name: "España" },
  ],
  address: {
    "@type": "PostalAddress",
    addressRegion: "Barcelona",
    addressCountry: "ES",
  },
  sameAs: [
    "https://www.linkedin.com/company/kroomix/",
    "https://www.instagram.com/kroomixcom/",
    "https://www.youtube.com/@kroomixcom",
  ],
  knowsAbout: [
    "automatización de procesos",
    "inteligencia artificial para empresas",
    "integración de sistemas",
    "chatbots",
    "páginas web que convierten",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${dmSans.variable} ${manrope.variable} ${plusJakartaSans.variable} ${outfit.variable} ${sora.variable}`}
    >
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
