"use client";

import type { ReactNode } from "react";

import { I18nProvider } from "@/lib/i18n";
import type { Language } from "@/lib/i18n-data";

export function Providers({ children, initialLanguage }: { children: ReactNode; initialLanguage: Language }) {
  return <I18nProvider initialLanguage={initialLanguage}>{children}</I18nProvider>;
}
