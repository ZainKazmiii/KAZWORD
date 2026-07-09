import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kazword",
  description: "Solve today's Kazword! A daily word puzzle where themed 5-letter words are interconnected on a grid. Use colored tile feedback to solve them all in 6 attempts.",
  openGraph: {
    title: "Kazword",
    description: "Solve today's Kazword! A daily word puzzle where themed 5-letter words are interconnected on a grid. Use colored tile feedback to solve them all in 6 attempts.",
    url: "https://kazword.com",
    siteName: "Kazword",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kazword",
    description: "Solve today's Kazword! A daily word puzzle where themed 5-letter words are interconnected on a grid. Use colored tile feedback to solve them all in 6 attempts.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
{children}
        <Analytics />
        <GoogleAnalytics gaId="G-JHLHMZ6GJR" />
      </body>
    </html>
  );
}
