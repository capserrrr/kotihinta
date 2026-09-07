import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ErrorCode, MetricType } from "@/lib/i18n";
import { fetchDetachedHouseSeries } from "@/lib/mml";
import {
  fetchMunicipalitySeries,
  fetchPostcodeSeries,
  findKuntaCodeByName,
  type PropertyType,
  type Rooms,
} from "@/lib/statfin";
import {
  computeHouseValuation,
  computeTrends,
  computeValuation,
  type Condition,
} from "@/lib/valuation";

export interface SearchRequestBody {
  address: string;
  propertyType: PropertyType;
  rooms: Rooms;
  /** Living area for kerrostalo/rivitalo (required); plot size for
   * omakotitalo (optional — only used for a small comparison adjustment,
   * since living-area data doesn't exist in the open land registry). */
  sizeM2?: number;
  yearBuilt?: number;
  condition: Condition;
}

function errorResponse(code: ErrorCode, status: number, extra?: object) {
  return NextResponse.json({ errorCode: code, ...extra }, { status });
}

function hasEnoughData(series: { pricePerM2: number | null }[] | null): boolean {
  if (!series) return false;
  return series.filter((p) => p.pricePerM2 !== null).length >= 4;
}

export async function POST(request: Request) {
  let body: SearchRequestBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_request", 400);
  }

  if (!body.address?.trim()) {
    return errorResponse("missing_address", 400);
  }
  if (body.propertyType !== "omakotitalo" && (!body.sizeM2 || body.sizeM2 <= 0)) {
    return errorResponse("missing_size", 400);
  }

  let geo;
  try {
    geo = await geocodeAddress(body.address);
  } catch {
    return errorResponse("geocode_failed", 502);
  }

  if (!geo) {
    return errorResponse("address_not_found", 404);
  }

  try {
    if (body.propertyType === "omakotitalo") {
      const house = await fetchDetachedHouseSeries(geo.postcode, geo.city);
      if (!house) {
        return errorResponse("no_data", 404, { address: geo });
      }

      const trends = computeTrends(house.series);
      const valuation = computeHouseValuation(house.series, {
        condition: body.condition,
        yearBuilt: body.yearBuilt,
        lotSizeM2: body.sizeM2 && body.sizeM2 > 0 ? body.sizeM2 : undefined,
        avgLotSizeM2: house.avgLotSizeM2,
      });

      return NextResponse.json({
        address: geo,
        area: { scope: house.scope },
        series: house.series,
        trends,
        valuation,
        metricType: "median" satisfies MetricType,
      });
    }

    let scope: "postcode" | "municipality" | null = null;
    let series = geo.postcode
      ? await fetchPostcodeSeries(geo.postcode, body.propertyType, body.rooms)
      : null;

    if (hasEnoughData(series)) {
      scope = "postcode";
    } else if (geo.city) {
      const kuntaCode = await findKuntaCodeByName(geo.city);
      if (kuntaCode) {
        const municipalitySeries = await fetchMunicipalitySeries(kuntaCode, body.propertyType);
        if (hasEnoughData(municipalitySeries)) {
          series = municipalitySeries;
          scope = "municipality";
        }
      }
    }

    if (!scope || !series) {
      return errorResponse("no_data", 404, { address: geo });
    }

    const trends = computeTrends(series);
    const valuation = computeValuation(series, {
      sizeM2: body.sizeM2 as number,
      condition: body.condition,
      yearBuilt: body.yearBuilt,
    });

    return NextResponse.json({
      address: geo,
      area: { scope },
      series,
      trends,
      valuation,
      metricType: "per_m2" satisfies MetricType,
    });
  } catch (err) {
    console.error(err);
    return errorResponse("fetch_failed", 502);
  }
}
