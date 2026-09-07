import type { AdjustmentCode, TrendCode } from "./i18n";
import type { PricePoint } from "./statfin";

export type Condition = "erinomainen" | "hyva" | "tyydyttava" | "valttava";

export interface ValuationInput {
  sizeM2: number;
  condition: Condition;
  yearBuilt?: number;
}

export interface Adjustment {
  code: AdjustmentCode;
  percent: number;
}

export interface ValuationResult {
  /** "per_m2": referenceValue is €/m², multiplied by size to get baseValue
   *  (kerrostalo/rivitalo). "median": referenceValue IS the base value — the
   *  land registry only reports a median total sale price for houses, since
   *  plot sizes vary too much to standardise a €/m² figure. */
  mode: "per_m2" | "median";
  referenceValue: number;
  referencePeriod: string;
  baseValue: number;
  adjustments: Adjustment[];
  estimate: number;
  low: number;
  high: number;
  confidence: "high" | "medium" | "low";
  transactionCount: number;
  /** Detached houses only: the area's average registered plot size, and the
   * user's own, when a lot-size adjustment was applied. */
  avgLotSizeM2?: number;
  userLotSizeM2?: number;
}

const CONDITION_CODE: Record<Condition, AdjustmentCode> = {
  erinomainen: "condition_erinomainen",
  hyva: "condition_hyva",
  tyydyttava: "condition_tyydyttava",
  valttava: "condition_valttava",
};

const CONDITION_PERCENT: Record<Condition, number> = {
  erinomainen: 8,
  hyva: 0,
  tyydyttava: -7,
  valttava: -15,
};

function ageAdjustment(yearBuilt: number): { code: AdjustmentCode; percent: number } {
  const age = new Date().getFullYear() - yearBuilt;
  if (age < 5) return { code: "age_new", percent: 6 };
  if (age < 15) return { code: "age_fairly_new", percent: 2 };
  if (age < 40) return { code: "age_mid", percent: 0 };
  if (age < 70) return { code: "age_older", percent: -4 };
  return { code: "age_old", percent: -8 };
}

function buildAdjustments(condition: Condition, yearBuilt?: number): Adjustment[] {
  const adjustments: Adjustment[] = [
    { code: CONDITION_CODE[condition], percent: CONDITION_PERCENT[condition] },
  ];
  if (yearBuilt) adjustments.push(ageAdjustment(yearBuilt));
  return adjustments;
}

/** How the user's plot compares to the area's average — a modest, capped
 * nudge (same spirit as the condition/age adjustments), not a linear scaling
 * of price by land area, since land value doesn't scale that simply. */
function lotSizeAdjustment(
  userLotSizeM2: number,
  avgLotSizeM2: number
): { code: AdjustmentCode; percent: number } | null {
  if (avgLotSizeM2 <= 0) return null;
  const ratio = userLotSizeM2 / avgLotSizeM2;
  if (ratio >= 1.5) return { code: "lot_much_larger", percent: 5 };
  if (ratio >= 1.15) return { code: "lot_larger", percent: 2 };
  if (ratio > 0.85) return { code: "lot_typical", percent: 0 };
  if (ratio > 0.6) return { code: "lot_smaller", percent: -2 };
  return { code: "lot_much_smaller", percent: -5 };
}

function confidenceFromCount(
  count: number
): Pick<ValuationResult, "confidence"> & { bandPercent: number } {
  if (count < 5) return { confidence: "low", bandPercent: 14 };
  if (count < 15) return { confidence: "medium", bandPercent: 10 };
  return { confidence: "high", bandPercent: 7 };
}

function latestUsablePoint(series: PricePoint[]): PricePoint | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].pricePerM2 !== null) return series[i];
  }
  return null;
}

function stepsPerYear(series: PricePoint[]): number {
  return series[0]?.period.includes("Q") ? 4 : 1;
}

export interface TrendPoint {
  code: TrendCode;
  sinceYear?: string;
  changePercent: number | null;
}

export function computeTrends(series: PricePoint[]): TrendPoint[] {
  const latest = latestUsablePoint(series);
  if (!latest) return [];
  const latestIndex = series.findIndex((p) => p.period === latest.period);
  const perYear = stepsPerYear(series);

  const at = (yearsAgo: number): number | null => {
    const idx = latestIndex - yearsAgo * perYear;
    if (idx < 0) return null;
    return series[idx].pricePerM2;
  };

  const pctChange = (from: number | null, to: number): number | null =>
    from && from > 0 ? Math.round(((to - from) / from) * 1000) / 10 : null;

  const oneYearAgo = at(1);
  const fiveYearsAgo = at(5);
  const first = series.find((p) => p.pricePerM2 !== null)?.pricePerM2 ?? null;

  return [
    { code: "1y", changePercent: pctChange(oneYearAgo, latest.pricePerM2!) },
    { code: "5y", changePercent: pctChange(fiveYearsAgo, latest.pricePerM2!) },
    {
      code: "since_start",
      sinceYear: series[0].period.slice(0, 4),
      changePercent: pctChange(first, latest.pricePerM2!),
    },
  ];
}

/** Apartments/row houses: reference is €/m², scaled by the user's size. */
export function computeValuation(
  series: PricePoint[],
  input: ValuationInput
): ValuationResult | null {
  const latest = latestUsablePoint(series);
  if (!latest || latest.pricePerM2 === null) return null;

  const referenceValue = latest.pricePerM2;
  const baseValue = referenceValue * input.sizeM2;
  const adjustments = buildAdjustments(input.condition, input.yearBuilt);
  const totalPercent = adjustments.reduce((sum, a) => sum + a.percent, 0);
  const estimate = Math.round(baseValue * (1 + totalPercent / 100));
  const count = latest.transactionCount ?? 0;
  const { confidence, bandPercent } = confidenceFromCount(count);

  return {
    mode: "per_m2",
    referenceValue,
    referencePeriod: latest.period,
    baseValue,
    adjustments,
    estimate,
    low: Math.round(estimate * (1 - bandPercent / 100)),
    high: Math.round(estimate * (1 + bandPercent / 100)),
    confidence,
    transactionCount: count,
  };
}

/** Detached houses ("omakotitalo"): the land registry only reports a median
 * total sale price per area, not a €/m² figure, so the reference value IS
 * the base value — it isn't scaled by the user's entered size. Living/floor
 * area isn't tracked anywhere in the open data, but registered plot size is,
 * so when the user gives their plot size it becomes one more small, capped
 * adjustment alongside condition and age — not a driver of the estimate. */
export function computeHouseValuation(
  series: PricePoint[],
  input: Pick<ValuationInput, "condition" | "yearBuilt"> & {
    lotSizeM2?: number;
    avgLotSizeM2?: number | null;
  }
): ValuationResult | null {
  const latest = latestUsablePoint(series);
  if (!latest || latest.pricePerM2 === null) return null;

  const referenceValue = latest.pricePerM2;
  const adjustments = buildAdjustments(input.condition, input.yearBuilt);

  const hasLotComparison = !!(input.lotSizeM2 && input.avgLotSizeM2);
  if (hasLotComparison) {
    const lotAdj = lotSizeAdjustment(input.lotSizeM2!, input.avgLotSizeM2!);
    if (lotAdj) adjustments.push(lotAdj);
  }

  const totalPercent = adjustments.reduce((sum, a) => sum + a.percent, 0);
  const estimate = Math.round(referenceValue * (1 + totalPercent / 100));
  const count = latest.transactionCount ?? 0;
  const { confidence, bandPercent } = confidenceFromCount(count);

  return {
    mode: "median",
    referenceValue,
    referencePeriod: latest.period,
    baseValue: referenceValue,
    adjustments,
    estimate,
    low: Math.round(estimate * (1 - bandPercent / 100)),
    high: Math.round(estimate * (1 + bandPercent / 100)),
    confidence,
    transactionCount: count,
    avgLotSizeM2: input.avgLotSizeM2 ?? undefined,
    userLotSizeM2: hasLotComparison ? input.lotSizeM2 : undefined,
  };
}
