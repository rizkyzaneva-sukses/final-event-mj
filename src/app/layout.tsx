import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Muda Juara",
  description: "Platform pendaftaran event & manajemen member Muda Juara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
