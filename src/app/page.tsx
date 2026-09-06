"use client";

import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchForm from "@/components/SearchForm";
import ResultsView from "@/components/ResultsView";
import type { SearchRequestBody } from "@/app/api/search/route";
import { BASE_PATH } from "@/lib/basePath";
import { useDictionary } from "@/lib/LanguageContext";
import type { ErrorCode } from "@/lib/i18n";
import type { SearchErrorResponse, SearchResult } from "@/lib/types";

export default function Home() {
  const dict = useDictionary();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSubmit(values: SearchRequestBody) {
    setLoading(true);
    setErrorCode(null);
    setHasSearched(true);

    try {
      const res = await fetch(`${BASE_PATH}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(null);
        setErrorCode((data as SearchErrorResponse).errorCode ?? "fetch_failed");
        return;
      }

      setResult(data as SearchResult);
    } catch {
      setResult(null);
      setErrorCode("network_error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-14 sm:py-20">
      <div className="mb-6 flex items-center justify-between">
        <a
          href="https://ronnlof.com"
          className="text-[13px] text-muted transition hover:text-foreground"
        >
          &larr; {dict.backToBlog}
        </a>
        <LanguageSwitcher />
      </div>

      <div className="mb-10 text-center sm:mb-14">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Kotihinta Laskuri
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-[17px] leading-relaxed text-muted">
          {dict.hero.subtitle}
        </p>
      </div>

      <SearchForm onSubmit={handleSubmit} loading={loading} />

      <div className="mt-8">
        {errorCode && (
          <div className="rounded-2xl border border-negative/20 bg-negative/5 px-5 py-4 text-[14px] text-negative">
            {dict.errors[errorCode]}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
            <p className="text-[14px]">{dict.form.submitting}</p>
          </div>
        )}

        {!loading && result && <ResultsView result={result} />}

        {!loading && !result && !errorCode && hasSearched === false && (
          <>
            <p className="mt-2 text-center text-[13px] text-muted/70">{dict.exampleHint}</p>
            <p className="mt-1 text-center text-[12px] text-muted/50">Made by C.R.</p>
          </>
        )}
      </div>

      <footer className="mt-auto pt-16 text-center text-[12px] text-muted/60">
        {dict.footer}
      </footer>
    </main>
  );
}
