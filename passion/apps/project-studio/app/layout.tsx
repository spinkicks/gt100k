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
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: `noFlash` is a static build-time
            constant — its only interpolations are THEME_KEY and DEFAULT_THEME, both JSON.stringify'd
            module literals, so no user input reaches it. The value it reads back from localStorage is
            passed to setAttribute only, never eval'd. It must run before first paint to avoid a theme
            flash, so it cannot be a React component. */}
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
