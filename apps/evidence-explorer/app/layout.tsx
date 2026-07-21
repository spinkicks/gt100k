import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "GT100K — Provenance Observatory",
  description:
    "A navigable, content-addressed evidence DAG for one milestone — rendered as a calm, forensic-precise observatory. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
