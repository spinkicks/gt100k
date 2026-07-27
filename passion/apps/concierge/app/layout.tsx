import { ProductHeader } from "@gt100k/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// The three GT faces, self-hosted as packages so rendering never depends on a network. Literata
// sets display, Inter Tight the prose and the controls, Inconsolata the marks. Inter Tight's italic
// subset is loaded too, for the "Thinking..." pending line: a synthesised slant is visibly wrong.
import "@fontsource-variable/literata";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/inter-tight/wght-italic.css";
import "@fontsource-variable/inconsolata";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab — Concierge",
  description:
    "A calm, child-safe concierge: curated-first answers, grounded open-web retrieval only on a genuine gap, cite-or-refuse, and distress handed to a person. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="gt">
      <body>
        <ProductHeader current="concierge" />
        {children}
      </body>
    </html>
  );
}
