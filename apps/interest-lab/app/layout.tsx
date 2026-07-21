import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "GT100K — Interest Lab",
  description: "A synthetic Curiosity Atelier for exploring interests without fixed labels.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
