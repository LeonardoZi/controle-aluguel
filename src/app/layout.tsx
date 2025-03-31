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
  title: "Sistema ERP - Materiais Elétricos",
  description:
    "Sistema completo para gerenciamento de estoque, vendas, compras, fornecedores e clientes para comércio de materiais elétricos",
  keywords:
    "materiais elétricos, erp, controle de estoque, gestão de vendas, compras, fornecedores, clientes, relatórios",
  authors: [{ name: "Eletro Materiais LTDA" }],
  creator: "Eletro Materiais LTDA",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
