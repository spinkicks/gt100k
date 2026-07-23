import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "GT100K — Guide Console",
  description:
    "A calm, legible console for a human to promote / park / reopen interest hypotheses with the evidence in front of them. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
