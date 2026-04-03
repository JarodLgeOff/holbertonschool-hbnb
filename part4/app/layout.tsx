import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Hbnb",
  description: "Hbnb, la plateforme de réservation nouvelle génération.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={manrope.variable} lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <Navbar />
        <main>{children}</main>
        <Toaster closeButton position="top-right" richColors theme="system" />
      </body>
    </html>
  );
}