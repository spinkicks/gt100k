import { ProductHeader } from "@gt100k/ui";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted so the build stays offline and nothing loads from a third party at runtime.
const serif = localFont({
  variable: "--font-serif",
  display: "swap",
  src: [
    { path: "./fonts/Newsreader-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Newsreader-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Newsreader-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Newsreader-600.woff2", weight: "600", style: "normal" },
  ],
});

const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/Inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Inter-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "The Warm-Demanding Parent Playbook",
  description:
    "A plain-language guide for homeschool parents: how to help a child find and grow a real passion, with the research behind every claim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <ProductHeader current="parent" />
        {children}
      </body>
    </html>
  );
}
