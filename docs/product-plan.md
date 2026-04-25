# MappaQuartieri Product Plan

## Goal

Build an Italy-focused equivalent of WikiBarrio: a polished national interactive map for exploring socio-economic variables across every Italian comune, with finer sub-comune/suburb layers inside large cities where official boundaries exist.

## Reference UI

The target is the WikiBarrio-style screen provided by the user:

- fixed left sidebar with brand, description, metric selector, overview inset, city shortcuts, POI toggles, and top/bottom rankings
- full-screen map canvas with search, language/theme/help controls, choropleth polygons, light extrusion, city labels, attribution, legend, and zoom controls
- visual density optimized for scanning rather than storytelling

## MVP Scope

1. National shell
   - Italy-wide viewport
   - metric selector
   - search input for every comune and every loaded sub-comune area
   - city jump buttons for Roma, Milano, Napoli, Torino, Bologna, Firenze
   - ranked top and bottom areas
2. First metric
   - MEF comune-level `Reddito complessivo / Numero contribuenti`
   - label as `Reddito medio per contribuente (EUR)`
   - use CAP-level MEF data only as a fallback for city internals, with a caveat that CAP is not always a true neighborhood boundary
3. Boundary hierarchy
   - every Italian comune from ISTAT administrative boundaries
   - official city neighborhood/suburb boundaries where available
   - fall back to ISTAT aree sub comunali, census sections, or CAP polygons for major cities without official neighborhood data
4. POIs
   - schools, hospitals/clinics, pharmacies, supermarkets, train/metro, parks from OpenStreetMap
5. Map rendering
   - MapLibre GL JS
   - vector tiles or PMTiles for choropleth and POI layers
   - OpenMapTiles/OpenFreeMap-compatible basemap

## Data Strategy

The exact Italy clone cannot rely on a single Spanish-INE-style source. The product should normalize multiple sources behind one internal geography model:

```text
comune > official_neighborhood > istat_area_subcomunale > cap > census_section
```

The initial implementation should show every comune nationally. When a user zooms into a large city, the map should replace that comune polygon with the best available sub-comune layer.

## First Build Phases

1. App scaffold and mock contracts
   - typed metrics, areas, POIs, source metadata
   - WikiBarrio-style layout
   - pure ranking/color-scale helpers with tests
2. Data ingestion prototype
   - download MEF CAP CSV
   - download MEF comune CSV
   - download ISTAT comune identifier CSV
   - download ISTAT POSAS population CSV
   - download ISTAT administrative boundaries
   - normalize income variables
   - join income and population to comune geometries
   - overlay official sub-comune boundaries for large cities
   - export GeoJSON and PMTiles
3. City boundary loaders
   - Milano NIL, Roma quartieri/rioni/zone, Bologna aree statistiche, Firenze quartieri
   - document coverage and licenses per city
4. Production rendering
   - replace sample GeoJSON with hosted vector tiles
   - add hover/click inspector
   - add geocoder/search
5. Verification
   - unit tests for data transforms
   - integration tests for generated tile metadata
   - E2E checks for map load, metric selection, POI toggles, city jumps

## Key Risks

- CAP boundaries do not perfectly match quartieri, especially in large cities.
- Some municipalities publish useful neighborhood boundaries, others do not.
- MEF tax data is income-declaration data, not household disposable income.
- National vector tiles need simplification and zoom-specific tiling to avoid huge browser payloads.
- OpenStreetMap POI completeness varies by category and city.
