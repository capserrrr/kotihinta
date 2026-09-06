"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useDictionary } from "@/lib/LanguageContext";
import type { PricePoint } from "@/lib/statfin";
import type { SearchResult } from "@/lib/types";
import PriceHistoryChart from "./PriceHistoryChart";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-hover" />,
});

type RangeOption = "1" | "5" | "10" | "all";
const RANGE_VALUES: RangeOption[] = ["1", "5", "10", "all"];

// Drop any trailing periods with no price (the newest quarter is often still
// unpublished/suppressed) so range slicing always anchors on the latest
// quarter that actually has data — otherwise "1y" could silently compare a
// different, shorter span than the "1 year" stat below it.
function trimTrailingNulls(series: PricePoint[]): PricePoint[] {
  const lastUsable = series.findLastIndex((p) => p.pricePerM2 !== null);
  return lastUsable === -1 ? [] : series.slice(0, lastUsable + 1);
}

function filterByRange(series: PricePoint[], range: RangeOption): PricePoint[] {
  if (range === "all" || series.length === 0) return series;
  const perYear = series[0].period.includes("Q") ? 4 : 1;
  const years = range === "1" ? 1 : range === "5" ? 5 : 10;
  // +1 so the window includes BOTH endpoints — "1 year back" spans 4
  // quarters, which takes 5 points (this quarter plus the 4 before it).
  return series.slice(-(years * perYear + 1));
}

function computeRangeChangePercent(series: PricePoint[]): number | null {
  const usable = series.filter((p) => p.pricePerM2 !== null);
  if (usable.length < 2) return null;
  const first = usable[0].pricePerM2 as number;
  const last = usable[usable.length - 1].pricePerM2 as number;
  if (!first) return null;
  return Math.round(((last - first) / first) * 1000) / 10;
}

function formatEur(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: "bg-positive",
  medium: "bg-amber-500",
  low: "bg-negative",
};

export default function ResultsView({ result }: { result: SearchResult }) {
  const dict = useDictionary();
  const { address, area, series, trends, valuation, metricType } = result;
  const metric = dict.results.metric[metricType];
  const [range, setRange] = useState<RangeOption>("10");

  const streetLine = [address.road, address.houseNumber].filter(Boolean).join(" ");
  const trimmedSeries = useMemo(() => trimTrailingNulls(series), [series]);
  const visibleSeries = useMemo(
    () => filterByRange(trimmedSeries, range),
    [trimmedSeries, range]
  );
  const earliestPeriod = series[0]?.period;
  const rangeChangePercent = useMemo(
    () => computeRangeChangePercent(visibleSeries),
    [visibleSeries]
  );
  const areaLabel = dict.results.areaLabel(area.scope, address.postcode, address.city);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="order-1 rounded-3xl border border-border bg-surface/60 p-6 sm:p-7 lg:order-none lg:col-start-1">
        <div className="text-[13px] font-medium uppercase tracking-wide text-muted">
          {dict.results.searchedAddress}
        </div>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">
          {streetLine || address.label.split(",")[0]}
        </h2>
        <p className="mt-1 text-[15px] text-muted">{address.city}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-3 py-1 text-[13px] text-muted">
          {dict.results.priceData}: {areaLabel}
          {area.scope === "municipality" && (
            <span className="text-muted/70">({dict.results.municipalityFallbackNote})</span>
          )}
        </div>
      </div>

      <div className="order-3 flex flex-col gap-6 lg:order-none lg:col-start-1">
        <div className="rounded-3xl border border-border bg-surface/60 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {metric.chartTitle} — {areaLabel}
              </h3>
              <p className="mt-0.5 text-[13px] text-muted">
                {dict.results.source}: {metric.dataSourceLabel}
                {earliestPeriod && ` · ${dict.results.availableSince(earliestPeriod)}`}
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              {RANGE_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                    range === value
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {dict.results.rangeOptions[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-2.5">
            <span
              className={`text-2xl font-semibold tabular-nums ${
                rangeChangePercent === null
                  ? "text-muted"
                  : rangeChangePercent >= 0
                    ? "text-positive"
                    : "text-negative"
              }`}
            >
              {rangeChangePercent === null
                ? dict.results.noData
                : `${rangeChangePercent >= 0 ? "+" : ""}${rangeChangePercent.toFixed(1)}%`}
            </span>
            <span className="text-[13px] text-muted">{dict.results.rangeChangeLabel(range)}</span>
          </div>

          <div className="mt-3">
            <PriceHistoryChart
              series={visibleSeries}
              valueLabel={metric.valueLabel}
              valueSuffix={metric.valueSuffix}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface/60 p-6 sm:p-7">
          <h3 className="text-[15px] font-semibold text-foreground">{dict.results.location}</h3>
          <div className="mt-4 h-56 w-full overflow-hidden rounded-2xl border border-border">
            <LocationMap lat={address.lat} lon={address.lon} />
          </div>
        </div>

        {trends.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {trends.map((trend) => {
              const isPositive = (trend.changePercent ?? 0) >= 0;
              return (
                <div
                  key={trend.code}
                  className="rounded-2xl border border-border bg-surface/60 px-4 py-3"
                >
                  <div className="text-[13px] text-muted">
                    {dict.results.trendLabel(trend.code, trend.sinceYear)}
                  </div>
                  <div
                    className={`mt-0.5 text-lg font-semibold ${
                      trend.changePercent === null
                        ? "text-muted"
                        : isPositive
                          ? "text-positive"
                          : "text-negative"
                    }`}
                  >
                    {trend.changePercent === null
                      ? dict.results.noData
                      : `${isPositive ? "+" : ""}${trend.changePercent.toFixed(1)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {valuation ? (
        <div className="order-2 rounded-3xl border border-border bg-surface/60 p-6 sm:p-7 lg:order-none lg:col-start-2 lg:row-span-2">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted">
            {dict.results.estimatedValue}
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {formatEur(valuation.estimate)}
          </div>
          <div className="mt-1 text-[14px] text-muted">
            {dict.results.rangeSeparator} {formatEur(valuation.low)} – {formatEur(valuation.high)}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[13px] text-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${CONFIDENCE_DOT[valuation.confidence]}`}
            />
            {dict.results.confidenceLabels[valuation.confidence]}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {dict.results.confidenceReason(valuation.transactionCount, valuation.confidence)}
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <div className="text-[13px] font-medium text-foreground">
              {dict.results.valuationBasis}
            </div>
            <div className="mt-3 flex items-center justify-between text-[14px]">
              <span className="text-muted">
                {valuation.mode === "per_m2"
                  ? dict.results.areaPricePerM2(valuation.referencePeriod)
                  : dict.results.areaMedianPrice(valuation.referencePeriod)}
              </span>
              <span className="font-medium text-foreground">
                {formatEur(valuation.referenceValue)}
                {valuation.mode === "per_m2" ? "/m²" : ""}
              </span>
            </div>
            {valuation.mode === "per_m2" && (
              <div className="mt-2 flex items-center justify-between text-[14px]">
                <span className="text-muted">{dict.results.baseCalculation}</span>
                <span className="font-medium text-foreground">
                  {formatEur(valuation.baseValue)}
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2.5">
              {valuation.adjustments.map((adj) => (
                <div key={adj.code} className="flex items-center justify-between text-[14px]">
                  <span className="text-muted">{dict.adjustments[adj.code]}</span>
                  <span
                    className={`font-medium ${
                      adj.percent > 0
                        ? "text-positive"
                        : adj.percent < 0
                          ? "text-negative"
                          : "text-muted"
                    }`}
                  >
                    {adj.percent > 0 ? "+" : ""}
                    {adj.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[12px] leading-relaxed text-muted/80">
            {dict.results.disclaimer(metric.dataSourceLabel)}
          </p>
        </div>
      ) : (
        <div className="order-2 rounded-3xl border border-border bg-surface/60 p-6 text-[14px] text-muted lg:order-none lg:col-start-2">
          {dict.results.noValuation}
        </div>
      )}
    </div>
  );
}
