import type { FeatureCollection, Polygon } from "geojson";
import type { NeighborhoodArea, PoiFeature } from "../types/geography";

export const sampleAreas: readonly NeighborhoodArea[] = [
  {
    id: "roma-prati",
    name: "Prati",
    city: "Roma",
    region: "Lazio",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 34850, year: 2024 }]
  },
  {
    id: "roma-testaccio",
    name: "Testaccio",
    city: "Roma",
    region: "Lazio",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 29210, year: 2024 }]
  },
  {
    id: "milano-brera",
    name: "Brera",
    city: "Milano",
    region: "Lombardia",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 45120, year: 2024 }]
  },
  {
    id: "milano-lorenteggio",
    name: "Lorenteggio",
    city: "Milano",
    region: "Lombardia",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 24680, year: 2024 }]
  },
  {
    id: "napoli-chiaia",
    name: "Chiaia",
    city: "Napoli",
    region: "Campania",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 31170, year: 2024 }]
  },
  {
    id: "napoli-sanita",
    name: "Sanita",
    city: "Napoli",
    region: "Campania",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 17120, year: 2024 }]
  },
  {
    id: "bologna-saragozza",
    name: "Saragozza",
    city: "Bologna",
    region: "Emilia-Romagna",
    areaLevel: "subcomune",
    granularity: "istat_area_subcomunale",
    metrics: [{ metricId: "income_per_taxpayer", value: 33640, year: 2024 }]
  },
  {
    id: "firenze-centro",
    name: "Centro Storico",
    city: "Firenze",
    region: "Toscana",
    areaLevel: "subcomune",
    granularity: "official_neighborhood",
    metrics: [{ metricId: "income_per_taxpayer", value: 32190, year: 2024 }]
  }
];

export const sampleAreaGeoJson: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "roma-prati",
      properties: {
        id: "roma-prati",
        name: "Prati",
        city: "Roma",
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
      id: "roma-testaccio",
      properties: {
        id: "roma-testaccio",
        name: "Testaccio",
        city: "Roma",
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
      id: "milano-brera",
      properties: {
        id: "milano-brera",
        name: "Brera",
        city: "Milano",
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
      id: "milano-lorenteggio",
      properties: {
        id: "milano-lorenteggio",
        name: "Lorenteggio",
        city: "Milano",
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
    },
    {
      type: "Feature",
      id: "napoli-chiaia",
      properties: {
        id: "napoli-chiaia",
        name: "Chiaia",
        city: "Napoli",
        value: 31170
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [14.215, 40.842],
            [14.242, 40.843],
            [14.244, 40.823],
            [14.219, 40.82],
            [14.215, 40.842]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "napoli-sanita",
      properties: {
        id: "napoli-sanita",
        name: "Sanita",
        city: "Napoli",
        value: 17120
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [14.242, 40.864],
            [14.264, 40.866],
            [14.269, 40.849],
            [14.248, 40.846],
            [14.242, 40.864]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "bologna-saragozza",
      properties: {
        id: "bologna-saragozza",
        name: "Saragozza",
        city: "Bologna",
        value: 33640
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [11.305, 44.502],
            [11.34, 44.503],
            [11.342, 44.482],
            [11.309, 44.48],
            [11.305, 44.502]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "firenze-centro",
      properties: {
        id: "firenze-centro",
        name: "Centro Storico",
        city: "Firenze",
        value: 32190
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [11.235, 43.78],
            [11.274, 43.779],
            [11.275, 43.76],
            [11.238, 43.758],
            [11.235, 43.78]
          ]
        ]
      }
    }
  ]
};

export const samplePois: readonly PoiFeature[] = [
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
  },
  {
    id: "poi-napoli-transit",
    name: "Metro Chiaia",
    category: "transit",
    coordinates: [14.229, 40.833]
  },
  {
    id: "poi-bologna-park",
    name: "Parco Saragozza",
    category: "parks",
    coordinates: [11.322, 44.491]
  }
];
