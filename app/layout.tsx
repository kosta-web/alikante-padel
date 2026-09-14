import type { Metadata, Viewport } from "next";
import "./globals.css";

/* Fallback metadata for routes without their own `generateMetadata`
   (e.g. /admin). Public routes set their own title/description from
   Supabase (`site_settings` / `seo_pages`) — see app/page.tsx and co. */
export const metadata: Metadata = {
  title: "TOP PADEL ALICANTE",
  description: "Падел-клуб в Аликанте.",
};

export const viewport: Viewport = {
  themeColor: "#f8f8f6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="preload"
          href="/fonts/onest-cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/onest-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
