import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Bandhan | Bangladesh Fashion E-commerce",
    template: "%s | Bandhan"
  },
  description: "Premium women's fashion, sarees, salwar kameez, lehengas, kurtis, gowns, fabric, and bridal collections in Bangladesh.",
  openGraph: {
    title: "Bandhan",
    description: "Premium women's fashion e-commerce for Bangladesh.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
