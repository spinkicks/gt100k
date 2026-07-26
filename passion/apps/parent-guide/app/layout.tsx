import { ProductHeader } from "@gt100k/ui";
import type { Metadata } from "next";

// The three GT faces, self-hosted as packages so rendering never depends on a network. Literata
// sets display, Inter Tight the prose and the controls, Inconsolata the marks. The italic subsets
// are loaded too: this page leans on <em> and on an italic lede, and a synthesised slant on a
// light serif is visibly wrong.
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/inter-tight/wght-italic.css";
import "@fontsource-variable/inconsolata";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Warm-Demanding Parent Playbook",
  description:
    "A plain-language guide for homeschool parents: how to help a child find and grow a real passion, with the research behind every claim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" data-theme="gt">
      <body>
        <ProductHeader current="parent" />
        {children}
      </body>
    </html>
  );
}
