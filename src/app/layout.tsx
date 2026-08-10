import type { Metadata } from "next";
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

const TITLE = "Nordic Power & Weather Explorer";

const DESCRIPTION =
  "Norwegian day-ahead electricity prices for NO1 alongside hourly Oslo weather, hour by hour in Europe/Oslo time.";

/**
 * Resolves the origin that `metadataBase` needs to turn the generated Open Graph image
 * into the absolute URL crawlers require — a relative one is silently ignored.
 *
 * Vercel supplies `VERCEL_PROJECT_PRODUCTION_URL` without a scheme, and it names the
 * *production* domain from every environment, so preview deploys point their cards at
 * production rather than at a URL that dies with the branch. `SITE_URL` overrides both
 * for a custom domain.
 */
function siteUrl(): URL {
  const explicit = process.env.SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: TITLE,
  description: DESCRIPTION,
  /*
   * The landing page's job is to be sent to someone, so the link preview is part of the
   * product. `opengraph-image.tsx` supplies the image itself — listing it here as well
   * would produce two `og:image` tags.
   */
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  /*
   * The dashboard and login are behind a password and have nothing to offer a crawler.
   * The landing page opts back in explicitly in its own metadata.
   */
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
