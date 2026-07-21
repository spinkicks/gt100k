import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Passion Tutor — GT100K",
  description: "A calm, synthetic practice interview about a passion project.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "oklch(0.94 0.04 140)",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
