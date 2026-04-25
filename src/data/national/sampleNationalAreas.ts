import type { FeatureCollection, Polygon } from "geojson";
import type { NeighborhoodArea, PoiFeature } from "../../types/geography";

export const nationalSampleAreas: readonly NeighborhoodArea[] = [
  {
    id: "comune-058091",
    name: "Roma",
    city: "Roma",
    region: "Lazio",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "058091",
    cadastralCode: "H501",
    province: "Roma",
    provinceCode: "058",
    population: 2748109,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 28740, year: 2024 },
      { metricId: "resident_population", value: 2748109, year: 2025 }
    ]
  },
  {
    id: "subcomune-roma-prati",
    name: "Prati",
    city: "Roma",
    region: "Lazio",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-058091",
    subcomuneKind: "quartiere",
    sourceIds: ["roma-quartieri"],
    metrics: [{ metricId: "income_per_taxpayer", value: 34850, year: 2024 }]
  },
  {
    id: "subcomune-roma-testaccio",
    name: "Testaccio",
    city: "Roma",
    region: "Lazio",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-058091",
    subcomuneKind: "quartiere",
    sourceIds: ["roma-quartieri"],
    metrics: [{ metricId: "income_per_taxpayer", value: 29210, year: 2024 }]
  },
  {
    id: "comune-015146",
    name: "Milano",
    city: "Milano",
    region: "Lombardia",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "015146",
    cadastralCode: "F205",
    province: "Milano",
    provinceCode: "015",
    population: 1371498,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 35840, year: 2024 },
      { metricId: "resident_population", value: 1371498, year: 2025 }
    ]
  },
  {
    id: "subcomune-milano-brera",
    name: "Brera",
    city: "Milano",
    region: "Lombardia",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-015146",
    subcomuneKind: "nil",
    sourceIds: ["milano-nil"],
    metrics: [{ metricId: "income_per_taxpayer", value: 45120, year: 2024 }]
  },
  {
    id: "subcomune-milano-lorenteggio",
    name: "Lorenteggio",
    city: "Milano",
    region: "Lombardia",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-015146",
    subcomuneKind: "nil",
    sourceIds: ["milano-nil"],
    metrics: [{ metricId: "income_per_taxpayer", value: 24680, year: 2024 }]
  },
  {
    id: "comune-063049",
    name: "Napoli",
    city: "Napoli",
    region: "Campania",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "063049",
    cadastralCode: "F839",
    province: "Napoli",
    provinceCode: "063",
    population: 908082,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 22960, year: 2024 },
      { metricId: "resident_population", value: 908082, year: 2025 }
    ]
  },
  {
    id: "subcomune-napoli-chiaia",
    name: "Chiaia",
    city: "Napoli",
    region: "Campania",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-063049",
    subcomuneKind: "quartiere",
    sourceIds: ["napoli-quartieri"],
    metrics: [{ metricId: "income_per_taxpayer", value: 31170, year: 2024 }]
  },
  {
    id: "subcomune-napoli-sanita",
    name: "Sanita",
    city: "Napoli",
    region: "Campania",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-063049",
    subcomuneKind: "quartiere",
    sourceIds: ["napoli-quartieri"],
    metrics: [{ metricId: "income_per_taxpayer", value: 17120, year: 2024 }]
  },
  {
    id: "comune-037006",
    name: "Bologna",
    city: "Bologna",
    region: "Emilia-Romagna",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "037006",
    cadastralCode: "A944",
    province: "Bologna",
    provinceCode: "037",
    population: 392203,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 31120, year: 2024 },
      { metricId: "resident_population", value: 392203, year: 2025 }
    ]
  },
  {
    id: "subcomune-bologna-saragozza",
    name: "Saragozza",
    city: "Bologna",
    region: "Emilia-Romagna",
    areaLevel: "subcomune",
    granularity: "istat_area_subcomunale",
    parentComuneId: "comune-037006",
    subcomuneKind: "area_statistica",
    sourceIds: ["bologna-aree-statistiche"],
    metrics: [{ metricId: "income_per_taxpayer", value: 33640, year: 2024 }]
  },
  {
    id: "comune-048017",
    name: "Firenze",
    city: "Firenze",
    region: "Toscana",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "048017",
    cadastralCode: "D612",
    province: "Firenze",
    provinceCode: "048",
    population: 367150,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 30140, year: 2024 },
      { metricId: "resident_population", value: 367150, year: 2025 }
    ]
  },
  {
    id: "subcomune-firenze-centro",
    name: "Centro Storico",
    city: "Firenze",
    region: "Toscana",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    parentComuneId: "comune-048017",
    subcomuneKind: "quartiere",
    sourceIds: ["firenze-quartieri"],
    metrics: [{ metricId: "income_per_taxpayer", value: 32190, year: 2024 }]
  },
  {
    id: "comune-004003",
    name: "Alba",
    city: "Alba",
    region: "Piemonte",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "004003",
    cadastralCode: "A124",
    province: "Cuneo",
    provinceCode: "004",
    population: 31243,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 28420, year: 2024 },
      { metricId: "resident_population", value: 31243, year: 2025 }
    ]
  },
  {
    id: "comune-007003",
    name: "Bard",
    city: "Bard",
    region: "Valle d'Aosta",
    areaLevel: "comune",
    granularity: "municipality",
    istatCode: "007003",
    cadastralCode: "A643",
    province: "Valle d'Aosta",
    provinceCode: "007",
    population: 107,
    sourceIds: ["mef-irpef-comune", "istat-comuni-codes", "istat-admin-boundaries"],
    metrics: [
      { metricId: "income_per_taxpayer", value: 23150, year: 2024 },
      { metricId: "resident_population", value: 107, year: 2025 }
    ]
  }
];

export const nationalSampleGeoJson: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "comune-058091",
      properties: {
        id: "comune-058091",
        name: "Roma",
        city: "Roma",
        areaLevel: "comune",
        value: 28740
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [12.32, 42.02],
            [12.72, 42.0],
            [12.71, 41.72],
            [12.33, 41.73],
            [12.32, 42.02]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "subcomune-roma-prati",
      properties: {
        id: "subcomune-roma-prati",
        parentComuneId: "comune-058091",
        name: "Prati",
        city: "Roma",
        areaLevel: "subcomune",
        value: 34850
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [12.455, 41.915],
            [12.485, 41.918],
            [12.49, 41.9],
            [12.46, 41.895],
            [12.455, 41.915]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "subcomune-roma-testaccio",
      properties: {
        id: "subcomune-roma-testaccio",
        parentComuneId: "comune-058091",
        name: "Testaccio",
        city: "Roma",
        areaLevel: "subcomune",
        value: 29210
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [12.465, 41.885],
            [12.49, 41.887],
            [12.494, 41.872],
            [12.47, 41.868],
            [12.465, 41.885]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "comune-015146",
      properties: {
        id: "comune-015146",
        name: "Milano",
        city: "Milano",
        areaLevel: "comune",
        value: 35840
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [9.06, 45.55],
            [9.3, 45.55],
            [9.31, 45.39],
            [9.07, 45.38],
            [9.06, 45.55]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "subcomune-milano-brera",
      properties: {
        id: "subcomune-milano-brera",
        parentComuneId: "comune-015146",
        name: "Brera",
        city: "Milano",
        areaLevel: "subcomune",
        value: 45120
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [9.178, 45.476],
            [9.198, 45.476],
            [9.201, 45.462],
            [9.181, 45.46],
            [9.178, 45.476]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "subcomune-milano-lorenteggio",
      properties: {
        id: "subcomune-milano-lorenteggio",
        parentComuneId: "comune-015146",
        name: "Lorenteggio",
        city: "Milano",
        areaLevel: "subcomune",
        value: 24680
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [9.125, 45.458],
            [9.158, 45.457],
            [9.158, 45.436],
            [9.128, 45.435],
            [9.125, 45.458]
          ]
        ]
      }
    }
  ]
};

export const nationalSamplePois: readonly PoiFeature[] = [
  {
    id: "poi-roma-school",
    name: "Scuola Prati",
    category: "schools",
    coordinates: [12.472, 41.909]
  },
  {
    id: "poi-roma-health",
    name: "Clinica Testaccio",
    category: "healthcare",
    coordinates: [12.482, 41.878]
  },
  {
    id: "poi-milano-pharmacy",
    name: "Farmacia Brera",
    category: "pharmacies",
    coordinates: [9.188, 45.468]
  },
  {
    id: "poi-milano-market",
    name: "Supermercato Lorenteggio",
    category: "supermarkets",
    coordinates: [9.142, 45.445]
  }
];
