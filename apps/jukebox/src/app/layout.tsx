import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "YMQ Jukebox",
  description: "yv's media queue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
