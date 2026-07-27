import type { Metadata } from "next";
import type { ReactNode } from "react";

// The three GT faces, self-hosted as packages so rendering never depends on a network. Literata
// sets display type, Inter Tight the prose and every control, Inconsolata the marks (buttons, tags,
// badges, and the content addresses this app is built around). Inter Tight's italic subset comes
// too, for the Inspector's empty-state lines: a synthesised slant is visibly wrong.
//
// This replaces next/font/google's Fraunces + IBM Plex Sans + IBM Plex Mono. Those were a
// deliberate trio, and they are now the wrong trio: the app wears the house identity instead.
import "@fontsource-variable/literata";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/inter-tight/wght-italic.css";
import "@fontsource-variable/inconsolata";
import "./globals.css";

export const metadata: Metadata = {
  title: "GT100K — Provenance Observatory",
  description:
    "A navigable, content-addressed evidence DAG for one milestone — rendered as a calm, forensic-precise observatory. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // data-theme="gt" selects the GT School values inside @gt100k/design-tokens. Without it the
    // contract's own neutral defaults would render and the identity would be absent, silently.
    <html lang="en" data-theme="gt">
      <body>{children}</body>
    </html>
  );
}
