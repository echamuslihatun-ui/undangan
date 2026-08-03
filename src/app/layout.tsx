import React from "react";
import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Great_Vibes,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: {
    default: "Undanganku - Platform Undangan Online Pernikahan",
    template: "%s | Undanganku",
  },
  description:
    "Buat undangan pernikahan digital yang elegan. Pilih template, kustomisasi, bayar, dan sebar undangan via WhatsApp.",
  keywords: ["undangan online", "undangan pernikahan digital", "undangan website", "wedding invitation", "undanganku"],
  authors: [{ name: "Undanganku" }],
  openGraph: {
    title: "Undanganku - Platform Undangan Online Pernikahan",
    description:
      "Buat undangan pernikahan digital yang elegan. Pilih template, kustomisasi, bayar, dan sebar undangan via WhatsApp.",
    url: process.env.NEXTAUTH_URL || "https://undanganku.id",
    siteName: "Undanganku",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undanganku - Platform Undangan Online Pernikahan",
    description:
      "Buat undangan pernikahan digital yang elegan. Pilih template, kustomisasi, bayar, dan sebar undangan via WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${playfair.variable} ${greatVibes.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}