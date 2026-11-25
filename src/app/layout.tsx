import type { Metadata } from "next";
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
  title: "Studio Bella Lash | Extensão de Cílios & Agendamento Online",
  description:
    "Agende seu procedimento de extensão de cílios online, confira nosso catálogo de técnicas e fale direto pelo WhatsApp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#120b10] text-rose-50 selection:bg-rose-500/30 selection:text-rose-100">
        {children}
      </body>
    </html>
  );
}
