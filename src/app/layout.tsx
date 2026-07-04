import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-syne",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020259",
};

export const metadata: Metadata = {
  title: {
    default: "GhanaPay — Your Money, Your Way",
    template: "%s | GhanaPay",
  },
  description:
    "The unified national mobile money wallet platform powered by Ghana's commercial banks and rural community banks. Send money, pay bills, and manage your finances.",
  keywords: ["Ghana", "mobile money", "digital payments", "wallet", "MTN MoMo", "bank transfer"],
  authors: [{ name: "GhanaPay" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
