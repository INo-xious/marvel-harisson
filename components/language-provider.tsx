"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { localeCookieName, siteCopy, type Locale } from "@/data/locale";

type LanguageContextValue = {
  locale: Locale;
  copy: (typeof siteCopy)[Locale];
  setLocale: (locale: Locale) => void;
  pending: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type ScrollSnapshot = { x: number; y: number };

function restoreScroll({ x, y }: ScrollSnapshot) {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(x, y);
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

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
  const scrollRestoreRef = useRef<ScrollSnapshot | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
  }, []);

  useEffect(() => {
    if (pending || !scrollRestoreRef.current) return undefined;
    const scrollSnapshot = scrollRestoreRef.current;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        restoreScroll(scrollSnapshot);
        scrollRestoreRef.current = null;
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [pending]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;
      const scrollSnapshot = { x: window.scrollX, y: window.scrollY };
      scrollRestoreRef.current = scrollSnapshot;
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      document.documentElement.dataset.languageTransition = "scramble";
      transitionTimerRef.current = window.setTimeout(() => {
        document.documentElement.removeAttribute("data-language-transition");
        transitionTimerRef.current = null;
      }, 920);
      document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      setLocaleState(nextLocale);
      startTransition(() => router.refresh());
      window.requestAnimationFrame(() => restoreScroll(scrollSnapshot));
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
