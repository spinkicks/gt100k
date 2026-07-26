// Self-hosted via next/font/local — no network fetch at build time, so CI stays hermetic. Inter,
// the same face the guide console uses: the front door has to look like the product it opens.
import localFont from "next/font/local";

export const sans = localFont({
  src: "./fonts/inter.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});
