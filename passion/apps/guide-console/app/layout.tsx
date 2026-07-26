import { ProductHeader } from "@gt100k/ui";
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
      <body>
        {/* The shared product bar sits above the console's own shell, which measures its full-height
            columns from below it (see --plh-h in globals.css). */}
        <ProductHeader current="guide" />
        {children}
      </body>
    </html>
  );
}
