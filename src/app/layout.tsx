import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Nordic Power & Weather Explorer";

const DESCRIPTION =
  "Norwegian day-ahead electricity prices for NO1 alongside hourly Oslo weather, hour by hour in Europe/Oslo time.";

/*
 * No Open Graph or Twitter metadata, and no `metadataBase`.
 *
 * That surface existed for the landing page, whose job was to be sent to someone — a link
 * preview was part of the product. With the landing page gone the app is login and
 * dashboard, both behind a password, so a card would advertise a door nobody can open.
 * Removing it also retires the `SITE_URL` / `VERCEL_PROJECT_PRODUCTION_URL` resolution
 * that existed only to make the generated image's URL absolute.
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /*
   * Nothing here is public any more, so this is no longer a default that one route opts
   * back out of — it applies to every page in the app.
   */
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
