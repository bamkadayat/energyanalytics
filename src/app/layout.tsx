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
 * No Open Graph, Twitter card or `metadataBase`: every route is behind a password, so a
 * link preview would advertise a door nobody can open.
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
