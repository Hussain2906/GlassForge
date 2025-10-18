// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from '@/components/ui/sonner';
import AuthGate from '@/components/AuthGate';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Glass ERP",
  description: "Quoting • Orders • Invoices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthGate>{children}</AuthGate>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
