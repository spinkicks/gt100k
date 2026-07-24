// Self-hosted fonts via next/font/local — no network fetch at build time, so CI stays hermetic.
// Inter (a neutral grotesque) for text, JetBrains Mono for ids / urls / paths.
import localFont from "next/font/local";

export const sans = localFont({
  src: "./fonts/inter.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});

export const mono = localFont({
  src: "./fonts/mono.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-mono-face",
  display: "swap",
});
