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
// Registered property (land) area — the land registry tracks parcels, not
// building floor area, so this is plot size, not living space.
const INDICATOR_AVG_LOT_SIZE = 2312; // pinta-ala keskiarvo m2

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

/** Average registered plot size for a region, for the given reference year —
 * falling back to the nearest year with data if that exact year is missing. */
async function avgLotSizeForRegion(
  regionId: number,
  referenceYear: number
): Promise<number | null> {
  const rows = await fetchIndicatorData(INDICATOR_AVG_LOT_SIZE);
  const byYear = new Map<number, number>();
  for (const row of rows) {
    if (row.region === regionId && row.value !== null) byYear.set(row.year, row.value);
  }
  if (byYear.size === 0) return null;
  if (byYear.has(referenceYear)) return byYear.get(referenceYear)!;

  let closestYear: number | null = null;
  let closestDiff = Infinity;
  for (const year of byYear.keys()) {
    const diff = Math.abs(year - referenceYear);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestYear = year;
    }
  }
  return closestYear !== null ? (byYear.get(closestYear) ?? null) : null;
}

export interface DetachedHouseSeries {
  scope: "postcode" | "municipality";
  series: PricePoint[];
  /** Average registered plot size in the area for the latest usable period,
   * in m² — this is land area (what the land registry tracks), not building
   * floor area, which isn't part of any open Finnish dataset. */
  avgLotSizeM2: number | null;
}

/** Median sale-price history for detached ("omakotitalo") houses, by postal
 * code area, falling back to municipality when the postcode has too few
 * recorded transactions. Unlike the ASHI apartment data, the land registry
 * only reports a total sale-price median — not a price per square metre —
 * since living/floor area isn't tracked here; only registered plot size is. */
export async function fetchDetachedHouseSeries(
  postcode: string | null,
  cityName: string | null
): Promise<DetachedHouseSeries | null> {
  const candidates: Array<{ scope: "postcode" | "municipality"; regionId: number }> = [];

  if (postcode) {
    const regionId = await findPostcodeRegionId(postcode);
    if (regionId) candidates.push({ scope: "postcode", regionId });
  }
  if (cityName) {
    const kuntaId = await findKuntaRegionId(cityName);
    if (kuntaId) candidates.push({ scope: "municipality", regionId: kuntaId });
  }

  for (const candidate of candidates) {
    const series = await seriesForRegion(candidate.regionId);
    if (!hasEnoughData(series)) continue;

    const latestUsable = [...series].reverse().find((p) => p.pricePerM2 !== null);
    const avgLotSizeM2 = latestUsable
      ? await avgLotSizeForRegion(candidate.regionId, Number(latestUsable.period))
      : null;

    return { scope: candidate.scope, series, avgLotSizeM2 };
  }

  return null;
}
