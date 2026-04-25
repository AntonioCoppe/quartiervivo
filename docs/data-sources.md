# Italy Data Sources

Current as of 2026-04-25.

## Income

### MEF Dipartimento delle Finanze

- Source: https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes
- Dataset family: `Redditi e principali variabili Irpef su base comunale`
- National layer: `Comune`
- Big-city fallback layer: `Sub-Comunale(CAP)`, only when a city lacks official neighborhood income
- Latest observed release: `Dichiarazioni 2025 - anno d'imposta 2024`, published `23 aprile 2026`
- Useful fields:
  - `Numero contribuenti`
  - `Reddito complessivo`
  - income class counts
  - `Reddito imponibile`
  - `Imposta netta`
- Derived MVP metric:
  - `average_taxable_income = Reddito complessivo / Numero contribuenti`
- Caveat:
  - Comune attribution is based on fiscal domicile, not where the income was earned.
  - Privacy suppression blanks very low-frequency cells, especially values with frequency `<= 3`.
  - CAP is a postal geography, not always a social neighborhood. Use it only for city internals when no better official sub-comune data exists.

### ISTAT comune identifiers

- Source: https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
- Source page: https://www.istat.it/classificazione/codici-dei-comuni-delle-province-e-delle-regioni/
- Current observed update: `21 febbraio 2026`
- Current observed comune count: `7.894`
- Use:
  - bridge `Codice catastale` from MEF to `Codice Comune formato alfanumerico` / ISTAT codes
  - region, province, and current comune names
- Caveat:
  - administrative changes and Sardinia recoding require using the same reference date across boundaries, identifiers, income, and population.
  - the 2026 boundary shapefile is at `1 gennaio 2026`, while the current code list is `21 febbraio 2026`; use SITUAS or a date-specific archive when doing strict joins.

## Population

### ISTAT POSAS

- Source: https://demo.istat.it/data/posas/POSAS_2025_it_Comuni.zip
- Dataset: population by age, sex, and comune
- Use:
  - total resident population by comune
  - age-structure metrics after MVP
- Caveat:
  - POSAS year and boundary year must be reconciled with the ISTAT comune identifier table.

## Census and Demographics

### ISTAT Basi territoriali e variabili censuarie

- Source: https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/
- Coverage: Italy
- Geographies:
  - sezioni di censimento
  - aree di censimento
  - aree sub comunali, including municipi and quartieri where present
  - localita
- Formats:
  - shapefile for census sections, WGS 84 UTM Zona 32N
  - KMZ for 2011 and 2021 releases
- Use:
  - national boundary base
  - fine-grained demographic variables
  - fallback for cities without official neighborhood open data

### ISTAT Confini amministrativi

- Source page: https://www.istat.it/it/archivio/222527
- Latest observed release: administrative boundaries updated to `1 gennaio 2026`
- Direct generalized archive pattern observed from ISTAT storage:
  - https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip
- Direct detailed archive pattern observed from ISTAT storage:
  - https://www.istat.it/storage/cartografia/confini_amministrativi/non_generalizzati/2026/Limiti01012026.zip
- Use:
  - national comune polygons for every Italian comune
  - province and region context layers
- Caveat:
  - source format is shapefile in WGS84 / UTM zone 32N; conversion to WGS84 lon/lat and vector tiles is required.
  - preserve `PRO_COM_T` as a text join key.

### ISTAT Dati per sezioni di censimento

- Source: https://www.istat.it/notizia/dati-per-sezioni-di-censimento/
- Latest observed update: data for census sections 2023 updated on `5 marzo 2026`, with page notes replaced on `6 marzo 2026`
- Variables:
  - sex
  - age
  - citizenship
  - education
  - employment
  - families
  - housing
- Use:
  - demographic metric family after the income MVP

## City Neighborhood Boundaries

Big cities should use official sub-comune boundaries when available. The first target list is Roma, Milano, Napoli, Torino, Palermo, Genova, Bologna, Firenze, Bari, Catania, Venezia, and Verona.

The machine-readable starter list is [subcomune-source-manifest.json](../data/subcomune-source-manifest.json).

| City | Preferred layer | Source |
| --- | --- | --- |
| Roma | Zone Urbanistiche | https://geoportale.comune.roma.it/catalogo/ |
| Milano | NIL PGT 2030 | https://dati.comune.milano.it/dataset/ds964-nil-vigenti-pgt-2030 |
| Napoli | Quartieri | https://trasparenza.comune.napoli.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/26532 |
| Torino | Quartieri | https://aperto.comune.torino.it/dataset/quartieri |
| Palermo | Circoscrizioni | https://opendata.comune.palermo.it/opendata-dataset.php?dataset=265 |
| Genova | Unita Urbanistiche | https://geodati.gov.it/resource/id/c_d969%3A79c161ac-0daa-4c74-b75f-eef1ae866ce2 |
| Bologna | Aree statistiche | https://opendata.comune.bologna.it/explore/dataset/aree-statistiche/ |
| Firenze | Aree elementari 2021 | https://opendata.comune.fi.it/index.php/page_dataset_show?id=aree-elementari-2021 |
| Bari | Municipi | https://www.dati.gov.it/node/view-dataset/dataset?id=da2b0e0f-e913-4944-9062-d23aeef7a6c5 |
| Catania | ISTAT ASC 2021 fallback | https://www.istat.it/storage/cartografia/basi_territoriali/2021/ASC_21.zip |
| Venezia | DBGT sub-comunale | https://dati.venezia.it/?q=tag%2Fdbgt |
| Verona | Zone Omogenee | https://dati.veneto.it/opendata/Comune_di_Verona_Confini_amministrativi_Zone_Omogenee?metadati=showall |

### Roma

- Source: https://www.comune.roma.it/web/it/i-quartieri-di-roma.page
- Current project geography: 327 quartieri, 22 rioni, 104 zone funzionali
- Interactive map entry points: municipality pages link to GeoRoma
- Use:
  - strongest initial official neighborhood layer
  - separate `rione`, `quartiere`, and `zona_funzionale` types

### Milano

- Source: https://dati.comune.milano.it/dataset?res_format=GeoJSON&tags=NIL&tags=geo
- Dataset: `Nuclei d'Identita Locale (NIL) VIGENTI - PGT 2030`
- Formats: GeoJSON, Esri Shape, CSV
- Use:
  - official Milano neighborhood layer
  - join demographic and environmental NIL datasets where available

### Bologna

- Source: https://opendata.comune.bologna.it/explore/dataset/aree-statistiche/table/
- Dataset: `Aree statistiche`
- Coverage: 90 statistical areas
- Use:
  - better-than-quartiere local layer for Bologna

Additional Bologna territorial files:

- Source: https://inumeridibolognametropolitana.it/basi-territoriali-0
- Available city levels: quartieri, zone, aree statistiche, sezioni di censimento 2021

### Firenze

- Source: https://opendata.comune.fi.it/page_dataset_show?id=5e08844a-c0d8-4d64-a3b2-d1ab58d9283f
- Dataset: `Aree quartieri`
- Coverage: 5 quartieri
- License: CC BY 4.0
- Use:
  - official municipal quartiere layer

## Points of Interest

### OpenStreetMap

- Italy extract: https://download.geofabrik.de/europe/italy.html
- Use:
  - schools: `amenity=school`
  - hospitals and clinics: `amenity=hospital`, `amenity=clinic`
  - pharmacies: `amenity=pharmacy`
  - supermarkets: `shop=supermarket`
  - train and metro: `railway=station`, `station=subway`, `station=light_rail`
  - parks: `leisure=park`
- Workflow options:
  - Overpass API for city prototypes
  - Geofabrik PBF for repeatable national extraction

## Basemap and Tiles

### MapLibre GL JS

- Source: https://maplibre.org/projects/gl-js/
- Use:
  - open-source browser renderer for vector tiles
  - fill extrusion layers for the WikiBarrio-style relief effect

### OpenMapTiles / OpenFreeMap-compatible styles

- OpenMapTiles: https://openmaptiles.org/
- OpenFreeMap can be used as a no-key prototype basemap, but production should make the basemap URL configurable and respect provider terms.

### PMTiles or vector tile server

- Preferred production path:
  - convert cleaned GeoJSON to PMTiles or MBTiles
  - serve from static storage or a tile server
  - keep choropleth polygons and POIs as separate layers
