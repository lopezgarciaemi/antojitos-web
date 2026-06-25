import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartWrapper from "@/components/CartWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antojitos Mexicanos | Comida Tradicional a Domicilio",
  description: "Los mejores antojitos mexicanos a domicilio. Tacos, quesadillas, tortas y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#181818]`}
      >
        {children}
        
        {/* Carrito - Solo se muestra en páginas de cliente autenticado */}
        <CartWrapper />
      </body>
    </html>
  );
}
