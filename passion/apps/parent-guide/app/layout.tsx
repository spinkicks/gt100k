import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Warm-Demanding Parent Playbook",
  description:
    "A plain-language guide for homeschool parents: how to help a child find and grow a real passion, with the research behind every claim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
