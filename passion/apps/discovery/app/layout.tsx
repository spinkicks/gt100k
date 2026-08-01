import type { Metadata } from "next";
import "@gt100k/design-tokens";
// The GT School identity's three faces, installed as packages rather than fetched from a remote
// stylesheet so a classroom with a slow or filtered network still renders the right type. Same three
// the guide console loads, which is the point: one product, one voice.
import "@fontsource-variable/literata";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/inconsolata";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "PassionLab",
  description: "Pick anything. You can always come back.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
