import type { GeocodedAddress } from "./geocode";
import type { ErrorCode, MetricType } from "./i18n";
import type { PricePoint } from "./statfin";
import type { TrendPoint, ValuationResult } from "./valuation";

export interface SearchResult {
  address: GeocodedAddress;
  area: { scope: "postcode" | "municipality" };
  series: PricePoint[];
  trends: TrendPoint[];
  valuation: ValuationResult | null;
  metricType: MetricType;
}

export interface SearchErrorResponse {
  errorCode: ErrorCode;
  address?: GeocodedAddress;
}
