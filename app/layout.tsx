import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GaramTrace — Verifikasi Keaslian Garam Lokal",
  description:
    "Prototipe verifikasi garam lokal berbasis pengetahuan lokal, indikasi awal AI, pengesahan komunitas, dan catatan blockchain Solana.",
  applicationName: "GaramTrace",
  keywords: [
    "garam lokal",
    "verifikasi produk",
    "blockchain",
    "Solana",
    "pengetahuan lokal",
    "traceability",
  ],
  authors: [{ name: "Tim UTS Verifikasi Garam" }],
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
