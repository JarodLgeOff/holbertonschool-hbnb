import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, normalizeLanguage, translations } from "@/lib/i18n-data";
import { Toaster } from "sonner";

import { Providers } from "./providers";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export async function generateMetadata(): Promise<Metadata> {
  const language = normalizeLanguage(cookies().get(LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_LANGUAGE);
  return {
    title: "Hbnb",
    description: translations[language]["app.metaDescription"],
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const initialLanguage = normalizeLanguage(cookies().get(LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_LANGUAGE);

  return (
    <html className={manrope.variable} lang={initialLanguage} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <Providers initialLanguage={initialLanguage}>
          <Navbar />
          <main>{children}</main>
        </Providers>
        <Toaster closeButton position="top-right" richColors theme="system" />
      </body>
    </html>
  );
}
