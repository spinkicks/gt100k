import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DEFAULT_THEME, THEME_KEY } from "./theme.js";

export const metadata: Metadata = {
  title: "My Project Studio",
  description:
    "A kid's project quest studio: do a real project and log the honest journey. Synthetic data only.",
};

// Set the saved theme before paint so there is no flash and React never owns the data-theme attr.
const noFlash = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});document.documentElement.setAttribute('data-theme',t||${JSON.stringify(
  DEFAULT_THEME,
)});}catch(e){document.documentElement.setAttribute('data-theme',${JSON.stringify(
  DEFAULT_THEME,
)});}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
