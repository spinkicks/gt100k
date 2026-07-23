import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab — Family Co-Engagement",
  description:
    "A guide-facing console for coaching a child's family toward warm-demanding support — autonomy support, structure, and non-contingent warmth. The system proposes; the guide disposes. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
