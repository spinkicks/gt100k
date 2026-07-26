import type { Metadata } from "next";
import type { JSX, ReactNode } from "react";

// The three GT faces, self-hosted as packages so rendering never depends on a network.
import "@fontsource-variable/literata";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/inconsolata";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab",
  description:
    "The front door: pick the surface you need and go. Guide Console, Parent Playbook, Project Studio. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html lang="en" data-theme="gt">
      <body>{children}</body>
    </html>
  );
}
