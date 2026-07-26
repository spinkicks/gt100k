import type { Metadata } from "next";
import type { JSX, ReactNode } from "react";

import { sans } from "./fonts.js";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionLab",
  description:
    "The front door: pick the surface you need and go. Guide Console, Parent Playbook, Project Studio. Synthetic data only.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
