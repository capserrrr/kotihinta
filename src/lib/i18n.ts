export type Lang = "fi" | "en" | "sv";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "fi", label: "Suomi" },
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
];

export const DEFAULT_LANG: Lang = "fi";

export type ConditionCode =
  | "condition_erinomainen"
  | "condition_hyva"
  | "condition_tyydyttava"
  | "condition_valttava";
export type AgeCode = "age_new" | "age_fairly_new" | "age_mid" | "age_older" | "age_old";
export type LotSizeCode =
  | "lot_much_larger"
  | "lot_larger"
  | "lot_typical"
  | "lot_smaller"
  | "lot_much_smaller";
export type AdjustmentCode = ConditionCode | AgeCode | LotSizeCode;
export type TrendCode = "1y" | "5y" | "since_start";
export type MetricType = "per_m2" | "median";
export type AreaScope = "postcode" | "municipality";
export type ErrorCode =
  | "invalid_request"
  | "missing_address"
  | "missing_size"
  | "geocode_failed"
  | "address_not_found"
  | "no_data"
  | "fetch_failed"
  | "network_error";

interface Dictionary {
  appName: string;
  hero: {
    subtitle: string;
  };
  form: {
    addressLabel: string;
    addressPlaceholder: string;
    propertyTypeLabel: string;
    propertyTypes: { kerrostalo: string; rivitalo: string; omakotitalo: string };
    roomsLabel: string;
    rooms: { "1": string; "2": string; "3plus": string };
    sizeLabel: string;
    lotSizeLabel: string;
    lotSizeOptional: string;
    lotSizePlaceholder: string;
    yearBuiltLabel: string;
    yearBuiltOptional: string;
    yearBuiltPlaceholder: string;
    conditionLabel: string;
    conditions: Record<ConditionCode, string>;
    submit: string;
    submitting: string;
  };
  results: {
    searchedAddress: string;
    priceData: string;
    municipalityFallbackNote: string;
    rangeOptions: { "1": string; "5": string; "10": string; all: string };
    rangeChangeLabel: (range: "1" | "5" | "10" | "all") => string;
    source: string;
    availableSince: (period: string) => string;
    location: string;
    trendLabel: (code: TrendCode, sinceYear?: string) => string;
    noData: string;
    estimatedValue: string;
    rangeSeparator: string;
    confidenceLabels: Record<"high" | "medium" | "low", string>;
    confidenceReason: (count: number, level: "high" | "medium" | "low") => string;
    valuationBasis: string;
    areaPricePerM2: (period: string) => string;
    areaMedianPrice: (period: string) => string;
    baseCalculation: string;
    adjustmentDetail: (percent: number) => string;
    disclaimer: (source: string) => string;
    noValuation: string;
    lotSizeContext: (avgLotSizeM2: number) => string;
    metric: Record<
      MetricType,
      { chartTitle: string; valueLabel: string; valueSuffix: string; dataSourceLabel: string }
    >;
    areaLabel: (scope: AreaScope, postcode: string | null, city: string | null) => string;
  };
  adjustments: Record<AdjustmentCode, string>;
  chart: {
    noData: string;
    salesWord: string;
  };
  errors: Record<ErrorCode, string>;
  footer: string;
  exampleHint: string;
  backToBlog: string;
}

const fi: Dictionary = {
  appName: "Kotihinta Laskuri",
  hero: {
    subtitle:
      "Hae mikä tahansa suomalainen osoite ja näe alueen todellinen hintahistoria sekä läpinäkyvä arvio asunnon markkina-arvosta.",
  },
  form: {
    addressLabel: "Osoite",
    addressPlaceholder: "esim. Mannerheimintie 10, Helsinki",
    propertyTypeLabel: "Talotyyppi",
    propertyTypes: { kerrostalo: "Kerrostalo", rivitalo: "Rivitalo", omakotitalo: "Omakotitalo" },
    roomsLabel: "Huoneita",
    rooms: { "1": "Yksiö", "2": "Kaksio", "3plus": "Kolmio+" },
    sizeLabel: "Koko (m²)",
    lotSizeLabel: "Tontin koko (m²)",
    lotSizeOptional: "(valinnainen)",
    lotSizePlaceholder: "esim. 1200",
    yearBuiltLabel: "Rakennusvuosi",
    yearBuiltOptional: "(valinnainen)",
    yearBuiltPlaceholder: "esim. 1998",
    conditionLabel: "Kunto",
    conditions: {
      condition_erinomainen: "Erinomainen",
      condition_hyva: "Hyvä / normaali",
      condition_tyydyttava: "Tyydyttävä",
      condition_valttava: "Välttävä, remontin tarve",
    },
    submit: "Hae hinta-arvio",
    submitting: "Haetaan…",
  },
  results: {
    searchedAddress: "Haettu osoite",
    priceData: "Hintadata",
    municipalityFallbackNote: "postinumeroalueella ei riittävästi kauppoja — käytetään kunnan tasoa",
    rangeOptions: { "1": "1 v", "5": "5 v", "10": "10 v", all: "Kaikki" },
    rangeChangeLabel: (range) =>
      ({
        "1": "Muutos viimeisen vuoden aikana",
        "5": "Muutos viimeisen 5 vuoden aikana",
        "10": "Muutos viimeisen 10 vuoden aikana",
        all: "Muutos koko saatavilla olevan ajan",
      })[range],
    source: "Lähde",
    availableSince: (period) => `saatavilla ${period} alkaen`,
    location: "Sijainti",
    trendLabel: (code, sinceYear) =>
      code === "1y" ? "1 vuosi" : code === "5y" ? "5 vuotta" : `Vuodesta ${sinceYear}`,
    noData: "Ei dataa",
    estimatedValue: "Arvioitu markkina-arvo",
    rangeSeparator: "Vaihteluväli",
    confidenceLabels: { high: "Korkea luotettavuus", medium: "Kohtalainen luotettavuus", low: "Matala luotettavuus" },
    confidenceReason: (count, level) =>
      level === "low"
        ? `Vain ${count} toteutunutta kauppaa alueella viimeisimmällä jaksolla — arvio on suuntaa-antava.`
        : level === "medium"
          ? `${count} toteutunutta kauppaa alueella viimeisimmällä jaksolla.`
          : `Perustuu ${count} toteutuneeseen kauppaan alueella viimeisimmällä tilastojaksolla.`,
    valuationBasis: "Arvion perusteet",
    areaPricePerM2: (period) => `Alueen neliöhinta (${period})`,
    areaMedianPrice: (period) => `Alueen mediaanihinta (${period})`,
    baseCalculation: "Peruslaskelma",
    adjustmentDetail: (percent) => `${percent > 0 ? "+" : ""}${percent}% arvioituun hintaan`,
    disclaimer: (source) =>
      `Arvio perustuu alueen toteutuneisiin kauppahintoihin (lähde: ${source}), ei yksittäisen asunnon tarkastukseen. Kyseessä on suuntaa-antava tilastollinen malli, ei virallinen arviokirja.`,
    noValuation: "Arviota ei voitu laskea tälle alueelle.",
    metric: {
      per_m2: {
        chartTitle: "Neliöhinnan historia",
        valueLabel: "Neliöhinta",
        valueSuffix: " / m²",
        dataSourceLabel: "Tilastokeskus, osakeasuntojen hinnat (avoin data)",
      },
      median: {
        chartTitle: "Kauppahinnan mediaanin historia",
        valueLabel: "Mediaanihinta",
        valueSuffix: "",
        dataSourceLabel: "Maanmittauslaitos, kauppahintarekisteri (avoin data)",
      },
    },
    areaLabel: (scope, postcode, city) =>
      scope === "postcode" && postcode ? `Postinumeroalue ${postcode}` : (city ?? ""),
    lotSizeContext: (avgLotSizeM2) =>
      `Alueen keskimääräinen tontti on noin ${Math.round(avgLotSizeM2)} m² — omakotitaloille ei ole avointa dataa asuinpinta-alasta, joten arvio perustuu tonttikokoon.`,
  },
  adjustments: {
    condition_erinomainen: "Erinomainen kunto",
    condition_hyva: "Hyvä / normaali kunto",
    condition_tyydyttava: "Tyydyttävä kunto",
    condition_valttava: "Välttävä kunto, remontin tarve",
    age_new: "Uudiskohde (alle 5 vuotta)",
    age_fairly_new: "Melko uusi (alle 15 vuotta)",
    age_mid: "Keski-ikäinen rakennuskanta",
    age_older: "Vanhempi rakennuskanta (40–70 vuotta)",
    age_old: "Vanha rakennuskanta (yli 70 vuotta), mahdollisia putki-/julkisivuremontteja",
    lot_much_larger: "Tontti selvästi keskimääräistä suurempi",
    lot_larger: "Tontti keskimääräistä suurempi",
    lot_typical: "Tontin koko lähellä alueen keskiarvoa",
    lot_smaller: "Tontti keskimääräistä pienempi",
    lot_much_smaller: "Tontti selvästi keskimääräistä pienempi",
  },
  chart: {
    noData: "Ei kuvaajaan riittävästi dataa.",
    salesWord: "kauppaa",
  },
  errors: {
    invalid_request: "Virheellinen pyyntö.",
    missing_address: "Anna osoite.",
    missing_size: "Anna asunnon koko neliömetreinä.",
    geocode_failed: "Osoitteen haku epäonnistui. Yritä hetken kuluttua uudelleen.",
    address_not_found:
      "Osoitetta ei löytynyt. Tarkista kirjoitusasu, esim. “Mannerheimintie 10, Helsinki”.",
    no_data: "Tälle alueelle ei löytynyt riittävästi kauppadataa tähän asuntotyyppiin.",
    fetch_failed: "Tilastodatan haku epäonnistui. Yritä hetken kuluttua uudelleen.",
    network_error: "Verkkovirhe. Tarkista yhteytesi ja yritä uudelleen.",
  },
  footer:
    "Hintadata: Tilastokeskus & Maanmittauslaitos (avoin data) · Osoitehaku: OpenStreetMap Nominatim · Arviot ovat suuntaa-antavia eivätkä korvaa virallista kiinteistöarviota.",
  exampleHint: "Esimerkki: “Runeberginkatu 60, Helsinki” tai “Hämeenkatu 5, Tampere”",
  backToBlog: "Casperin blogiin",
};

const en: Dictionary = {
  appName: "Home Price Calculator",
  hero: {
    subtitle:
      "Search any Finnish address to see the area's real price history and a transparent estimate of the property's market value.",
  },
  form: {
    addressLabel: "Address",
    addressPlaceholder: "e.g. Mannerheimintie 10, Helsinki",
    propertyTypeLabel: "Property type",
    propertyTypes: { kerrostalo: "Apartment block", rivitalo: "Row house", omakotitalo: "Detached house" },
    roomsLabel: "Rooms",
    rooms: { "1": "Studio", "2": "2-room", "3plus": "3-room+" },
    sizeLabel: "Size (m²)",
    lotSizeLabel: "Plot size (m²)",
    lotSizeOptional: "(optional)",
    lotSizePlaceholder: "e.g. 1200",
    yearBuiltLabel: "Year built",
    yearBuiltOptional: "(optional)",
    yearBuiltPlaceholder: "e.g. 1998",
    conditionLabel: "Condition",
    conditions: {
      condition_erinomainen: "Excellent",
      condition_hyva: "Good / average",
      condition_tyydyttava: "Fair",
      condition_valttava: "Poor, needs renovation",
    },
    submit: "Get price estimate",
    submitting: "Searching…",
  },
  results: {
    searchedAddress: "Searched address",
    priceData: "Price data",
    municipalityFallbackNote: "not enough sales in the postal-code area — using the municipality level",
    rangeOptions: { "1": "1y", "5": "5y", "10": "10y", all: "All" },
    rangeChangeLabel: (range) =>
      ({
        "1": "Change over the past year",
        "5": "Change over the past 5 years",
        "10": "Change over the past 10 years",
        all: "Change over the whole available period",
      })[range],
    source: "Source",
    availableSince: (period) => `available from ${period}`,
    location: "Location",
    trendLabel: (code, sinceYear) =>
      code === "1y" ? "1 year" : code === "5y" ? "5 years" : `Since ${sinceYear}`,
    noData: "No data",
    estimatedValue: "Estimated market value",
    rangeSeparator: "Range",
    confidenceLabels: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },
    confidenceReason: (count, level) =>
      level === "low"
        ? `Only ${count} completed sale(s) in the area in the latest period — the estimate is indicative.`
        : level === "medium"
          ? `${count} completed sales in the area in the latest period.`
          : `Based on ${count} completed sales in the area in the latest statistics period.`,
    valuationBasis: "Basis for the estimate",
    areaPricePerM2: (period) => `Area price per m² (${period})`,
    areaMedianPrice: (period) => `Area median price (${period})`,
    baseCalculation: "Base calculation",
    adjustmentDetail: (percent) => `${percent > 0 ? "+" : ""}${percent}% to the estimated price`,
    disclaimer: (source) =>
      `The estimate is based on completed sales in the area (source: ${source}), not an inspection of this specific property. This is an indicative statistical model, not an official valuation.`,
    noValuation: "An estimate could not be calculated for this area.",
    metric: {
      per_m2: {
        chartTitle: "Price per m² history",
        valueLabel: "Price per m²",
        valueSuffix: " / m²",
        dataSourceLabel: "Statistics Finland, housing prices (open data)",
      },
      median: {
        chartTitle: "Median sale price history",
        valueLabel: "Median price",
        valueSuffix: "",
        dataSourceLabel: "National Land Survey of Finland, purchase price register (open data)",
      },
    },
    areaLabel: (scope, postcode, city) =>
      scope === "postcode" && postcode ? `Postal code area ${postcode}` : (city ?? ""),
    lotSizeContext: (avgLotSizeM2) =>
      `The area's average plot is about ${Math.round(avgLotSizeM2)} m² — there's no open data on living area for detached houses, so the estimate uses plot size instead.`,
  },
  adjustments: {
    condition_erinomainen: "Excellent condition",
    condition_hyva: "Good / average condition",
    condition_tyydyttava: "Fair condition",
    condition_valttava: "Poor condition, needs renovation",
    age_new: "New build (under 5 years)",
    age_fairly_new: "Fairly new (under 15 years)",
    age_mid: "Mid-age building stock",
    age_older: "Older building stock (40–70 years)",
    age_old: "Old building stock (over 70 years), possible pipe/façade renovations",
    lot_much_larger: "Plot notably larger than average",
    lot_larger: "Plot larger than average",
    lot_typical: "Plot size close to the area average",
    lot_smaller: "Plot smaller than average",
    lot_much_smaller: "Plot notably smaller than average",
  },
  chart: {
    noData: "Not enough data for a chart.",
    salesWord: "sales",
  },
  errors: {
    invalid_request: "Invalid request.",
    missing_address: "Enter an address.",
    missing_size: "Enter the property's size in square metres.",
    geocode_failed: "Address lookup failed. Please try again shortly.",
    address_not_found: "Address not found. Check the spelling, e.g. “Mannerheimintie 10, Helsinki”.",
    no_data: "Not enough sales data was found for this area and property type.",
    fetch_failed: "Fetching the statistics failed. Please try again shortly.",
    network_error: "Network error. Check your connection and try again.",
  },
  footer:
    "Price data: Statistics Finland & National Land Survey of Finland (open data) · Address search: OpenStreetMap Nominatim · Estimates are indicative and do not replace an official property valuation.",
  exampleHint: "Example: “Runeberginkatu 60, Helsinki” or “Hämeenkatu 5, Tampere”",
  backToBlog: "Casper's blog",
};

const sv: Dictionary = {
  appName: "Bostadsprisräknare",
  hero: {
    subtitle:
      "Sök vilken finsk adress som helst för att se områdets verkliga prishistorik och en transparent uppskattning av bostadens marknadsvärde.",
  },
  form: {
    addressLabel: "Adress",
    addressPlaceholder: "t.ex. Mannerheimvägen 10, Helsingfors",
    propertyTypeLabel: "Hustyp",
    propertyTypes: { kerrostalo: "Höghus", rivitalo: "Radhus", omakotitalo: "Egnahemshus" },
    roomsLabel: "Rum",
    rooms: { "1": "Etta", "2": "Tvåa", "3plus": "Trea+" },
    sizeLabel: "Storlek (m²)",
    lotSizeLabel: "Tomtstorlek (m²)",
    lotSizeOptional: "(valfritt)",
    lotSizePlaceholder: "t.ex. 1200",
    yearBuiltLabel: "Byggnadsår",
    yearBuiltOptional: "(valfritt)",
    yearBuiltPlaceholder: "t.ex. 1998",
    conditionLabel: "Skick",
    conditions: {
      condition_erinomainen: "Utmärkt",
      condition_hyva: "Bra / normalt",
      condition_tyydyttava: "Nöjaktigt",
      condition_valttava: "Dåligt, renoveringsbehov",
    },
    submit: "Hämta prisuppskattning",
    submitting: "Söker…",
  },
  results: {
    searchedAddress: "Sökt adress",
    priceData: "Prisdata",
    municipalityFallbackNote: "för få affärer i postnummerområdet — använder kommunnivå",
    rangeOptions: { "1": "1 år", "5": "5 år", "10": "10 år", all: "Alla" },
    rangeChangeLabel: (range) =>
      ({
        "1": "Förändring under det senaste året",
        "5": "Förändring under de senaste 5 åren",
        "10": "Förändring under de senaste 10 åren",
        all: "Förändring under hela den tillgängliga perioden",
      })[range],
    source: "Källa",
    availableSince: (period) => `tillgänglig från ${period}`,
    location: "Läge",
    trendLabel: (code, sinceYear) =>
      code === "1y" ? "1 år" : code === "5y" ? "5 år" : `Sedan ${sinceYear}`,
    noData: "Ingen data",
    estimatedValue: "Uppskattat marknadsvärde",
    rangeSeparator: "Intervall",
    confidenceLabels: { high: "Hög tillförlitlighet", medium: "Måttlig tillförlitlighet", low: "Låg tillförlitlighet" },
    confidenceReason: (count, level) =>
      level === "low"
        ? `Endast ${count} genomförda affärer i området under den senaste perioden — uppskattningen är riktgivande.`
        : level === "medium"
          ? `${count} genomförda affärer i området under den senaste perioden.`
          : `Baserat på ${count} genomförda affärer i området under den senaste statistikperioden.`,
    valuationBasis: "Grund för uppskattningen",
    areaPricePerM2: (period) => `Områdets kvadratmeterpris (${period})`,
    areaMedianPrice: (period) => `Områdets medianpris (${period})`,
    baseCalculation: "Grundberäkning",
    adjustmentDetail: (percent) => `${percent > 0 ? "+" : ""}${percent}% på det uppskattade priset`,
    disclaimer: (source) =>
      `Uppskattningen baseras på genomförda affärer i området (källa: ${source}), inte på en besiktning av just denna bostad. Det är en riktgivande statistisk modell, inte ett officiellt värdeintyg.`,
    noValuation: "En uppskattning kunde inte beräknas för detta område.",
    metric: {
      per_m2: {
        chartTitle: "Historik för kvadratmeterpris",
        valueLabel: "Kvadratmeterpris",
        valueSuffix: " / m²",
        dataSourceLabel: "Statistikcentralen, bostadspriser (öppen data)",
      },
      median: {
        chartTitle: "Historik för medianpris",
        valueLabel: "Medianpris",
        valueSuffix: "",
        dataSourceLabel: "Lantmäteriverket, köpeskillingsregistret (öppen data)",
      },
    },
    areaLabel: (scope, postcode, city) =>
      scope === "postcode" && postcode ? `Postnummerområde ${postcode}` : (city ?? ""),
    lotSizeContext: (avgLotSizeM2) =>
      `Områdets genomsnittliga tomt är ungefär ${Math.round(avgLotSizeM2)} m² — det finns ingen öppen data om boarea för egnahemshus, så uppskattningen använder tomtstorlek istället.`,
  },
  adjustments: {
    condition_erinomainen: "Utmärkt skick",
    condition_hyva: "Bra / normalt skick",
    condition_tyydyttava: "Nöjaktigt skick",
    condition_valttava: "Dåligt skick, renoveringsbehov",
    age_new: "Nybygge (under 5 år)",
    age_fairly_new: "Ganska nytt (under 15 år)",
    age_mid: "Medelålders byggnadsbestånd",
    age_older: "Äldre byggnadsbestånd (40–70 år)",
    age_old: "Gammalt byggnadsbestånd (över 70 år), möjliga rör-/fasadrenoveringar",
    lot_much_larger: "Tomten betydligt större än genomsnittet",
    lot_larger: "Tomten större än genomsnittet",
    lot_typical: "Tomtstorlek nära områdets genomsnitt",
    lot_smaller: "Tomten mindre än genomsnittet",
    lot_much_smaller: "Tomten betydligt mindre än genomsnittet",
  },
  chart: {
    noData: "Inte tillräckligt med data för en graf.",
    salesWord: "affärer",
  },
  errors: {
    invalid_request: "Ogiltig begäran.",
    missing_address: "Ange en adress.",
    missing_size: "Ange bostadens storlek i kvadratmeter.",
    geocode_failed: "Adressökningen misslyckades. Försök igen om en stund.",
    address_not_found: "Adressen hittades inte. Kontrollera stavningen, t.ex. “Mannerheimvägen 10, Helsingfors”.",
    no_data: "Tillräcklig affärsdata hittades inte för detta område och denna bostadstyp.",
    fetch_failed: "Det gick inte att hämta statistiken. Försök igen om en stund.",
    network_error: "Nätverksfel. Kontrollera din anslutning och försök igen.",
  },
  footer:
    "Prisdata: Statistikcentralen & Lantmäteriverket (öppen data) · Adressökning: OpenStreetMap Nominatim · Uppskattningarna är riktgivande och ersätter inte ett officiellt värdeintyg.",
  exampleHint: "Exempel: “Runebergsgatan 60, Helsingfors” eller “Tavastgatan 5, Tammerfors”",
  backToBlog: "Till Caspers blogg",
};

const dictionaries: Record<Lang, Dictionary> = { fi, en, sv };

export function t(lang: Lang): Dictionary {
  return dictionaries[lang];
}
