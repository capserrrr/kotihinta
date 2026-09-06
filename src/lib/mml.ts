// Client for Maanmittauslaitos's (National Land Survey of Finland) open
// property-transaction statistics service, built on the official land
// registry (Kauppahintarekisteri). Free, open, no API key.
// Docs: https://www.maanmittauslaitos.fi/kiinteistotietojen-rajapintapalvelut/kiinteistokauppojen-tilastopalvelu-rest

import type { PricePoint } from "./statfin";

const BASE = "https://khr.maanmittauslaitos.fi/tilastopalvelu/rest/1.1";

// "Asuinpientalokiinteistöt asemakaava-alueella / rakennetut kohteet" —
// built detached-house properties in planned/zoned areas.
const INDICATOR_MEDIAN_PRICE = 2313; // kauppahinta mediaani €
const INDICATOR_COUNT = 2311; // lukumäärä kpl

const START_YEAR = 2000;

interface MmlRegion {
  id: number;
  code: string;
  category: string;
  title: { fi: string };
}

interface MmlDataRow {
  indicator: number;
  region: number;
  year: number;
  gender: string;
  value: number | null;
}

let regionsCache: MmlRegion[] | null = null;
async function fetchRegions(): Promise<MmlRegion[]> {
  if (regionsCache) return regionsCache;
  const res = await fetch(`${BASE}/regions`, { cache: "no-store" });
  if (!res.ok) throw new Error(`MML regions fetch failed ${res.status}`);
  regionsCache = (await res.json()) as MmlRegion[];
  return regionsCache;
}

const indicatorDataCache = new Map<number, MmlDataRow[]>();
async function fetchIndicatorData(indicatorId: number): Promise<MmlDataRow[]> {
  const cached = indicatorDataCache.get(indicatorId);
  if (cached) return cached;

  const years = Array.from(
    { length: new Date().getFullYear() - START_YEAR + 1 },
    (_, i) => START_YEAR + i
  ).join(",");

  const url = `${BASE}/json?indicator=${indicatorId}&years=${years}&genders=total`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`MML data fetch failed ${res.status}`);
  const data = (await res.json()) as MmlDataRow[];
  indicatorDataCache.set(indicatorId, data);
  return data;
}

async function findPostcodeRegionId(postcode: string): Promise<number | null> {
  const regions = await fetchRegions();
  return regions.find((r) => r.category === "POSTINUMERO" && r.code === postcode)?.id ?? null;
}

async function findKuntaRegionId(cityName: string): Promise<number | null> {
  const regions = await fetchRegions();
  const normalized = cityName.trim().toLowerCase();
  const kunnat = regions.filter((r) => r.category === "KUNTA");
  const exact = kunnat.find((r) => r.title.fi.toLowerCase() === normalized);
  if (exact) return exact.id;
  const partial = kunnat.find((r) => r.title.fi.toLowerCase().includes(normalized));
  return partial?.id ?? null;
}

async function seriesForRegion(regionId: number): Promise<PricePoint[]> {
  const [priceRows, countRows] = await Promise.all([
    fetchIndicatorData(INDICATOR_MEDIAN_PRICE),
    fetchIndicatorData(INDICATOR_COUNT),
  ]);

  const countByYear = new Map<number, number>();
  for (const row of countRows) {
    if (row.region === regionId && row.value !== null) countByYear.set(row.year, row.value);
  }

  const byYear = new Map<number, PricePoint>();
  for (const row of priceRows) {
    if (row.region !== regionId) continue;
    byYear.set(row.year, {
      period: String(row.year),
      pricePerM2: row.value,
      transactionCount: countByYear.get(row.year) ?? null,
    });
  }

  return [...byYear.values()].sort((a, b) => (a.period < b.period ? -1 : 1));
}

function hasEnoughData(series: PricePoint[]): boolean {
  return series.filter((p) => p.pricePerM2 !== null).length >= 3;
}

export interface DetachedHouseSeries {
  scope: "postcode" | "municipality";
  series: PricePoint[];
}

/** Median sale-price history for detached ("omakotitalo") houses, by postal
 * code area, falling back to municipality when the postcode has too few
 * recorded transactions. Unlike the ASHI apartment data, the land registry
 * only reports a total sale-price median — not a price per square metre —
 * since plot sizes vary too much to standardise that figure. */
export async function fetchDetachedHouseSeries(
  postcode: string | null,
  cityName: string | null
): Promise<DetachedHouseSeries | null> {
  if (postcode) {
    const regionId = await findPostcodeRegionId(postcode);
    if (regionId) {
      const series = await seriesForRegion(regionId);
      if (hasEnoughData(series)) {
        return { scope: "postcode", series };
      }
    }
  }

  if (cityName) {
    const kuntaId = await findKuntaRegionId(cityName);
    if (kuntaId) {
      const series = await seriesForRegion(kuntaId);
      if (hasEnoughData(series)) {
        return { scope: "municipality", series };
      }
    }
  }

  return null;
}
