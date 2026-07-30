import type { Metadata } from "next";
import localFont from "next/font/local";
import "@gt100k/design-tokens";
import "./lab.css";

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
  title: "PassionLab Design Lab",
  description: "Prototypes rendered from the same token contract as the real apps.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
