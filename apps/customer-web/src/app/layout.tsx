import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FloatingOrderButton } from "@/components/floating-order-button";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Neighborhood Tasting Menu — A weekly box from one NYC neighborhood",
  description:
    "Curated weekly delivery of artisan breads, snacks and pantry goods from one New York micro-neighborhood at a time.",
  authors: [{ name: "Neighborhood Tasting Menu" }],
  openGraph: {
    type: "website",
    title: "Neighborhood Tasting Menu — A weekly NYC artisan box",
    description:
      "One neighborhood, one box, one week. Sourdough, pastries and pantry staples from makers within a few blocks of one another.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas">
        <div className="flex min-h-screen flex-col bg-canvas">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <FloatingOrderButton />
        </div>
      </body>
    </html>
  );
}
