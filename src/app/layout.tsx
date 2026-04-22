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
  title: "Calculadora de ahorro en procesos — Empresas industriales y distribución",
  description:
    "Calcula en 2 minutos cuánto dinero y tiempo estás perdiendo en procesos manuales. Para empresas industriales, de distribución y logística.",
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
