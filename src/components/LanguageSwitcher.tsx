"use client";

import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`rounded-full px-3 py-1 text-[13px] font-medium uppercase transition ${
            lang === l.code
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {l.code}
        </button>
      ))}
    </div>
  );
}
