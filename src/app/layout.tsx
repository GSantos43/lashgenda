import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bella Lash | Extensão de Cílios & Agendamento Online",
  description:
    "Agende seu procedimento de extensão de cílios online, confira nosso catálogo de técnicas e fale direto pelo WhatsApp.",
  applicationName: "Bella Lash",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/pwa-icon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Bella Lash",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#030304",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#111111] selection:bg-[#EADCE0] selection:text-[#111111]">
        {children}
      </body>
    </html>
  );
}
