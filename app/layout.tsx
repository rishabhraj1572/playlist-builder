import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playlist Builder",
  description: "A Vercel-ready playlist builder for lawful HLS/DASH streams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
