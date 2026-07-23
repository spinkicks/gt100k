import type { Metadata } from "next";
import type { ReactNode } from "react";

import { mono, sans } from "./fonts.js";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab — Concierge",
  description:
    "A calm, child-safe concierge: curated-first answers, grounded open-web retrieval only on a genuine gap, cite-or-refuse, and distress handed to a person. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
