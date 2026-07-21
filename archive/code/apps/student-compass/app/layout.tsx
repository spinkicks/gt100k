import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "GT100K — Student Compass",
  description: "Daily learning loop (synthetic learner demo)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
