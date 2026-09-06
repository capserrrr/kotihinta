# Kotihinta Laskuri

A real-estate analytics tool for Finnish addresses: search an address, see the
area's real historic price trend, and get a transparent, formula-based
valuation estimate.

## Data sources

- **Historic prices (kerrostalo/rivitalo)**: [Statistics Finland (Tilastokeskus)](https://stat.fi/fi/tilasto/ashi)
  ASHI open dataset — real, quarterly average €/m² sale prices by postal-code
  area since 2009 (table `13mt`), with an annual municipality-level fallback
  (table `13mx`) for areas with too few postcode-level transactions. Free,
  open data (CC BY 4.0), no API key required.
- **Historic prices (omakotitalo)**: [Maanmittauslaitos](https://www.maanmittauslaitos.fi/kiinteistotietojen-rajapintapalvelut/kiinteistokauppojen-tilastopalvelu-rest)
  (National Land Survey of Finland) property-transaction statistics service,
  built on the official land registry (Kauppahintarekisteri) — real median
  sale prices by postal-code area since 2000, with the same municipality-level
  fallback. Free, open, no API key or registration required.
- **Geocoding**: [OpenStreetMap Nominatim](https://nominatim.org/) — resolves
  a typed address to coordinates, postcode, and municipality.
- **Map tiles**: [Esri's free light-gray canvas](https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer)
  (no API key required) via [Leaflet](https://leafletjs.com/) /
  [react-leaflet](https://react-leaflet.js.org/), showing the searched
  address on a map.

Neither Oikotie nor Etuovi is used: neither publishes a public read API for
listing or price data, and their sites are not scraped.

## Why area-level, not exact-address, history

Finland does not have a public per-address sale-price lookup for
individuals — querying *individual* transaction records in the land registry
(`kauppahintarekisteri`) requires a professional data-sharing agreement, and
the one consumer-facing service that used to show individual sale prices
(`asuntojen.hintatiedot.fi`) shut down its sales feed after its agreement
ended. The *aggregate statistics* built on that same registry, however, are
open — that's what powers the omakotitalo data here. So "history for this
address" always means the real, official trend for its postal-code area (or
municipality, when the postcode sample is too small), not a fabricated
per-building series.

## How the valuation works

Kerrostalo/rivitalo (Tilastokeskus data is per m²):

`estimate = (latest area €/m² × size in m²) × (1 + condition% + age%)`

Omakotitalo (the land registry only reports a median *total* sale price per
area — plot sizes vary too much to standardise a €/m² figure, so the entered
size isn't used in the calculation):

`estimate = latest area median sale price × (1 + condition% + age%)`

- **Condition**: user-selected, ±0–15%.
- **Age** (optional): derived from the building year, ±0–8%.
- **Confidence band**: ±7 / ±10 / ±14% around the estimate, widened when the
  area had few recorded transactions in the latest period.

Every input to the estimate is shown in the UI — there is no hidden model.
This is a statistical estimate, not a substitute for a professional
valuation.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Recharts, Geist font
via `next/font/google`.
