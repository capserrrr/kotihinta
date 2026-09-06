export interface GeocodedAddress {
  label: string;
  lat: number;
  lon: number;
  postcode: string | null;
  city: string | null;
  road: string | null;
  houseNumber: string | null;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  query: string
): Promise<GeocodedAddress | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "fi");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim's usage policy requires a descriptive User-Agent identifying the app.
      "User-Agent": "Kotihinta/1.0 (real estate analytics demo)",
      "Accept-Language": "fi",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`);
  }

  const results = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }>;

  if (!results.length) return null;

  const first = results[0];
  const address = first.address ?? {};
  const city =
    address.city ?? address.town ?? address.municipality ?? address.village ?? null;

  return {
    label: first.display_name,
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    postcode: address.postcode ?? null,
    city,
    road: address.road ?? null,
    houseNumber: address.house_number ?? null,
  };
}
