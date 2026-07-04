import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="en">
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
