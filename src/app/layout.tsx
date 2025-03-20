import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Estoque - Materiais Elétricos",
  description:
    "Sistema de gerenciamento de estoque para comércio de materiais elétricos",
  keywords:
    "estoque, materiais elétricos, controle de inventário, gestão de fornecedores",
  authors: [{ name: "Sua Empresa" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-screen-2xl mx-auto`}
      >
        {children}
      </body>
    </html>
  );
}
