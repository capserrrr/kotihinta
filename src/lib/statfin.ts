// Client for Statistics Finland's (Tilastokeskus) open PxWeb API — the "ASHI"
// (Osakeasuntojen hinnat) statistics. Free, open data (CC BY 4.0), no API key.
// Docs: https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ashi/

const BASE = "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/ashi";

export type PropertyType = "kerrostalo" | "rivitalo" | "omakotitalo";
export type ApartmentPropertyType = Extract<PropertyType, "kerrostalo" | "rivitalo">;
export type Rooms = "1" | "2" | "3plus";

export interface PricePoint {
  period: string; // e.g. "2024Q1" or "2024"
  pricePerM2: number | null;
  transactionCount: number | null;
}

export interface AreaPriceSeries {
  scope: "postcode" | "municipality";
  areaLabel: string;
  series: PricePoint[];
}

// Postcode-level table (13mt): quarterly, 2009Q1 onwards, split by room count.
const POSTCODE_TALOTYYPPI: Record<ApartmentPropertyType, Record<Rooms, string> | string> = {
  kerrostalo: { "1": "1", "2": "2", "3plus": "3" },
  rivitalo: "5",
};

// Municipality-level table (13mx): annual only, no room-count split.
const MUNICIPALITY_TALOTYYPPI: Record<ApartmentPropertyType, string> = {
  kerrostalo: "3",
  rivitalo: "1",
};

function postcodeTalotyyppiCode(propertyType: ApartmentPropertyType, rooms: Rooms): string {
  const mapping = POSTCODE_TALOTYYPPI[propertyType];
  return typeof mapping === "string" ? mapping : mapping[rooms];
}

interface PxWebResponse {
  data: Array<{ key: string[]; values: string[] }>;
}

async function pxWebQuery(table: string, query: unknown): Promise<PxWebResponse | null> {
  const res = await fetch(`${BASE}/${table}.px`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
    cache: "no-store",
  });

  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`StatFin API error ${res.status} on ${table}`);
  return (await res.json()) as PxWebResponse;
}

function parseValue(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Quarterly price history for a specific 5-digit postcode area, since 2009. */
export async function fetchPostcodeSeries(
  postcode: string,
  propertyType: ApartmentPropertyType,
  rooms: Rooms
): Promise<PricePoint[] | null> {
  const talotyyppi = postcodeTalotyyppiCode(propertyType, rooms);

  const result = await pxWebQuery("13mt", {
    query: [
      {
        code: "postinumeroalue_4_20220101",
        selection: { filter: "item", values: [postcode] },
      },
      { code: "talotyyppi_6_20131021", selection: { filter: "item", values: [talotyyppi] } },
      {
        code: "contentscode",
        selection: { filter: "item", values: ["keskihinta_aritm_nw", "lkm_julk20"] },
      },
    ],
    response: { format: "json" },
  });

  if (!result || !result.data.length) return null;
  return combinePriceAndCountRows(result);
}

function combinePriceAndCountRows(result: PxWebResponse): PricePoint[] {
  const byPeriod = new Map<string, PricePoint>();
  for (const row of result.data) {
    const period = row.key[0];
    const point = byPeriod.get(period) ?? {
      period,
      pricePerM2: null,
      transactionCount: null,
    };
    // values[] order follows the contentscode selection order we sent:
    // [price, count]
    const price = parseValue(row.values[0]);
    const count = row.values[1] !== undefined ? parseValue(row.values[1]) : null;
    point.pricePerM2 = price;
    point.transactionCount = count;
    byPeriod.set(period, point);
  }
  return [...byPeriod.values()].sort((a, b) => (a.period < b.period ? -1 : 1));
}

/** Annual price history for a municipality (kunta), since 2006 — used as a
 * fallback when the postcode area has no usable data. */
export async function fetchMunicipalitySeries(
  kuntaCode: string,
  propertyType: ApartmentPropertyType
): Promise<PricePoint[] | null> {
  const talotyyppi = MUNICIPALITY_TALOTYYPPI[propertyType];

  const result = await pxWebQuery("13mx", {
    query: [
      { code: "kunta_1_20150101", selection: { filter: "item", values: [kuntaCode] } },
      { code: "talotyyppi_5_20111209", selection: { filter: "item", values: [talotyyppi] } },
      {
        code: "contentscode",
        selection: { filter: "item", values: ["keskihinta_aritm_nw", "lkm_julk20"] },
      },
    ],
    response: { format: "json" },
  });

  if (!result || !result.data.length) return null;
  return combinePriceAndCountRows(result);
}

let kuntaListCache: Array<{ code: string; name: string }> | null = null;

/** All Finnish municipality codes + names, fetched once and cached in memory. */
export async function fetchKuntaList(): Promise<Array<{ code: string; name: string }>> {
  if (kuntaListCache) return kuntaListCache;

  const res = await fetch(`${BASE}/13mx.px`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch municipality list");
  const meta = (await res.json()) as {
    variables: Array<{ code: string; values: string[]; valueTexts: string[] }>;
  };
  const kuntaVar = meta.variables.find((v) => v.code === "kunta_1_20150101");
  if (!kuntaVar) return [];

  kuntaListCache = kuntaVar.values.map((code, i) => ({
    code,
    name: kuntaVar.valueTexts[i],
  }));
  return kuntaListCache;
}

export async function findKuntaCodeByName(cityName: string): Promise<string | null> {
  const list = await fetchKuntaList();
  const normalized = cityName.trim().toLowerCase();
  const exact = list.find((k) => k.name.toLowerCase() === normalized);
  if (exact) return exact.code;
  const partial = list.find(
    (k) => k.name.toLowerCase().includes(normalized) || normalized.includes(k.name.toLowerCase())
  );
  return partial?.code ?? null;
}
