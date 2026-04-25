import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Co-Host",
  description: "AI guest support for short-term rental hosts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
