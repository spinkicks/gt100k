import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/*
 * Deliberate, self-hosted type system (EE-007). next/font downloads + self-hosts these at BUILD time,
 * so there is no runtime fetch (honours FR-E19). Three faces, each chosen for a reason:
 *  - Fraunces — an optical-size old-style serif → archival authority for a provenance record (display).
 *  - IBM Plex Sans — a technical grotesque with real character (NOT Inter) → the instrument body.
 *  - IBM Plex Mono — purpose-built for the content-address / hash readouts, cohesive with Plex Sans.
 * Each exposes a CSS variable that globals.css consumes with a real fallback stack.
 */
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-display",
  axes: ["opsz"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--ff-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--ff-mono",
});

export const metadata: Metadata = {
  title: "GT100K — Provenance Observatory",
  description:
    "A navigable, content-addressed evidence DAG for one milestone — rendered as a calm, forensic-precise observatory. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
