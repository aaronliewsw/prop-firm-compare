import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prop Firm Compare",
  description:
    "Sortable dashboard comparing 47 crypto-focused proprietary trading firms — drawdown, profit split, payout speed, leverage, and per-program rules.",
  openGraph: {
    title: "Prop Firm Compare",
    description:
      "Compare 47 crypto prop firms: drawdown, profit split, payout speed, and leverage.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prop Firm Compare",
    description:
      "Compare 47 crypto prop firms: drawdown, profit split, payout speed, and leverage.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
