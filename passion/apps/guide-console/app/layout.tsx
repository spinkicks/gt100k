import type { Metadata } from "next";
import type { ReactNode } from "react";

import { mono, sans } from "./fonts.js";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab — Guide Console",
  description:
    "A calm, legible console for a human to promote / park / reopen interest hypotheses with the evidence in front of them. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
