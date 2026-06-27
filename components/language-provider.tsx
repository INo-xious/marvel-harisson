"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { localeCookieName, siteCopy, type Locale } from "@/data/locale";

type LanguageContextValue = {
  locale: Locale;
  copy: (typeof siteCopy)[Locale];
  setLocale: (locale: Locale) => void;
  pending: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;
      document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      setLocaleState(nextLocale);
      startTransition(() => router.refresh());
    },
    [locale, router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, copy: siteCopy[locale], setLocale, pending }),
    [locale, pending, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
