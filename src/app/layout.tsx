import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carnets SENA",
  description: "Sistema de carnets",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
