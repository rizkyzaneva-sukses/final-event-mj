import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muda Juara Finance",
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
