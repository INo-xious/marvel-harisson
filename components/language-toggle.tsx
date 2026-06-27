"use client";

import { useLanguage } from "@/components/language-provider";
import { ScrambleText } from "@/components/scramble-text";
import type { Locale } from "@/data/locale";

const options: Array<{ locale: Locale; labelKey: "english" | "japanese" }> = [
  { locale: "en", labelKey: "english" },
  { locale: "ja", labelKey: "japanese" },
];

export function LanguageToggle() {
  const { locale, copy, setLocale, pending } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label={copy.language.label} aria-busy={pending || undefined}>
      {options.map((option, index) => (
        <span key={option.locale} className="language-toggle-part">
          {index > 0 ? <span className="language-toggle-separator" aria-hidden="true">/</span> : null}
          <button
            type="button"
            onClick={() => setLocale(option.locale)}
            aria-label={copy.language[option.labelKey]}
            aria-pressed={locale === option.locale}
            data-active={locale === option.locale || undefined}
          >
            <ScrambleText text={copy.language[option.labelKey]} intensity="full" />
          </button>
        </span>
      ))}
    </div>
  );
}
