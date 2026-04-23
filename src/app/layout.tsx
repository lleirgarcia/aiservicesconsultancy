import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});


export const metadata: Metadata = {
  title: "Optimizamos el caos para crear claridad en tu negocio · Osona, Barcelona",
  description:
    "Optimizamos el caos para crear claridad en tu negocio. La claridad ahorra tiempo y dinero · Osona, Barcelona",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
