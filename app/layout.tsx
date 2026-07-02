import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prop Firm Compare",
  description:
    "Sortable dashboard comparing 76 crypto-focused proprietary trading firms — drawdown, profit split, payout speed, leverage, and per-program rules.",
  openGraph: {
    title: "Prop Firm Compare",
    description:
      "Compare 76 crypto prop firms: drawdown, profit split, payout speed, and leverage.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prop Firm Compare",
    description:
      "Compare 76 crypto prop firms: drawdown, profit split, payout speed, and leverage.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FDFDFD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
