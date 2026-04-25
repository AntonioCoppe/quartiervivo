# Architecture

## Frontend

- Vite + React + TypeScript
- MapLibre GL JS for the map canvas
- Local state for metric selection, active city, POI toggles, and selected area
- CSS modules are not required initially; the visual surface is a single app shell with focused components

## Domain Model

```text
DataSource
MetricDefinition
NeighborhoodArea
PoiFeature
CityShortcut
```

`NeighborhoodArea` now represents both `areaLevel: "comune"` and `areaLevel: "subcomune"` records. Sub-comune records carry `parentComuneId`, allowing the map to show every comune nationally and replace a large city with its internal suburbs/neighborhoods when available.

All user-facing layers should derive from immutable inputs. Domain helpers return new arrays/objects and never mutate source records.

## Data Pipeline

```text
raw source downloads
  -> source-specific parser
  -> normalized parquet/geojson
  -> geometry validation and simplification
  -> city coverage manifest
  -> vector tiles or PMTiles
  -> app layer metadata
```

Current scaffold commands:

- `npm run data:fetch` downloads official archives listed in `data/source-manifest.json`
- `npm run data:unpack` extracts downloaded ZIP files under `data/raw/extracted/`
- `npm run data:build` normalizes prepared CSV files into `public/data/national-areas.json` and `public/data/coverage.json`

Network access is required for `data:fetch`. In a restricted sandbox, manually place the source files in `data/raw/` and run `npm run data:build`.

## Tile Layers

Recommended layer split:

- `comuni`: national polygons with metric ids and numeric values
- `subcomuni`: big-city subdivision polygons, filtered by `parentComuneId`
- `area_labels`: centroid label points for selected zooms
- `poi`: points categorized by POI type
- `boundaries`: optional outlines for municipalities/provinces/regions

## Search

Initial:

- client-side city shortcut search
- address search placeholder in UI

Production:

- Pelias, Photon, Nominatim, or a provider-backed geocoder
- search results must identify source and confidence

## Source Attribution

The UI must visibly attribute:

- MEF Dipartimento delle Finanze for income data
- ISTAT for census data
- municipal portals for city boundaries
- OpenStreetMap contributors for POIs and basemap-derived features
