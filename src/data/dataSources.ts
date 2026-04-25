import type { DataSource } from "../types/geography";

export const dataSources: readonly DataSource[] = [
  {
    id: "mef-irpef-comune",
    name: "Redditi e principali variabili IRPEF su base comunale",
    publisher: "MEF Dipartimento delle Finanze",
    url: "https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?opendata=yes",
    license: "CC BY 3.0 IT",
    refreshCadence: "Annual",
    notes:
      "Primary national income source for every comune. Latest observed release is Dichiarazioni 2025, anno d'imposta 2024, published 2026-04-23."
  },
  {
    id: "mef-irpef-subcomune-cap",
    name: "Redditi e principali variabili IRPEF su base sub-comunale CAP",
    publisher: "MEF Dipartimento delle Finanze",
    url: "https://www1.finanze.gov.it/finanze/analisi_stat/public/index.php?tree=2025",
    license: "CC BY 3.0 IT",
    refreshCadence: "Annual",
    notes:
      "CAP-level income data for city internals where official neighborhood income is unavailable. CAPs are postal areas, not suburbs."
  },
  {
    id: "istat-comuni-codes",
    name: "Elenco comuni italiani",
    publisher: "ISTAT",
    url: "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv",
    license: "ISTAT open data terms",
    refreshCadence: "Administrative updates",
    notes:
      "Bridge table for codice ISTAT, codice catastale, province, region, and current/suppressed comune status. Current page observed at 2026-02-21 with 7,894 comuni."
  },
  {
    id: "istat-posas-comuni",
    name: "Popolazione residente per eta, sesso e comune",
    publisher: "ISTAT",
    url: "https://demo.istat.it/data/posas/POSAS_2025_it_Comuni.zip",
    license: "ISTAT open data terms",
    refreshCadence: "Annual",
    notes:
      "Population by age/sex/comune. Used to derive total resident population and demographic metrics for every comune."
  },
  {
    id: "istat-basi-territoriali",
    name: "Basi territoriali e variabili censuarie",
    publisher: "ISTAT",
    url: "https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/",
    license: "ISTAT open data terms",
    refreshCadence: "Census release cycle with corrections",
    notes:
      "National geography source for census sections, aree di censimento, aree sub comunali, and localita."
  },
  {
    id: "istat-admin-boundaries",
    name: "Confini amministrativi 2026",
    publisher: "ISTAT",
    url: "https://www.istat.it/it/archivio/222527",
    license: "ISTAT open data terms",
    refreshCadence: "Annual",
    notes:
      "National shapefiles for regions, provinces, and comuni, updated to 2026. Direct generalized archive is expected under ISTAT storage as Limiti01012026_g.zip; detailed archive as Limiti01012026.zip."
  },
  {
    id: "istat-sezioni-censimento",
    name: "Dati per sezioni di censimento",
    publisher: "ISTAT",
    url: "https://www.istat.it/notizia/dati-per-sezioni-di-censimento/",
    license: "ISTAT open data terms",
    refreshCadence: "Census release cycle with updates",
    notes:
      "Demographic variables by census section. 2023 section data were updated on 2026-03-05."
  },
  {
    id: "roma-quartieri",
    name: "I Quartieri di Roma / Zone Urbanistiche",
    publisher: "Roma Capitale",
    url: "https://geoportale.comune.roma.it/catalogo/",
    license: "CC BY 4.0",
    refreshCadence: "Project updates",
    notes:
      "Official city sub-comune geography; use zone urbanistiche for fine subdivisions and municipi for coarser admin areas."
  },
  {
    id: "milano-nil",
    name: "Nuclei d'Identita Locale vigenti PGT 2030",
    publisher: "Comune di Milano",
    url: "https://dati.comune.milano.it/dataset?res_format=GeoJSON&tags=NIL&tags=geo",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes:
      "Official Milano neighborhood layer available as GeoJSON, Esri Shape, and CSV."
  },
  {
    id: "napoli-quartieri",
    name: "Quartieri di Napoli",
    publisher: "Comune di Napoli",
    url: "https://trasparenza.comune.napoli.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/26532",
    license: "IODL 2.0",
    refreshCadence: "Municipal updates",
    notes:
      "Quartieri shapefile for Naples. Municipalita are a coarser alternative from the same portal."
  },
  {
    id: "torino-quartieri",
    name: "Quartieri di Torino",
    publisher: "Comune di Torino",
    url: "https://aperto.comune.torino.it/dataset/quartieri",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "Official quartieri layer; circoscrizioni are a coarser alternative."
  },
  {
    id: "palermo-circoscrizioni",
    name: "Perimetrazione circoscrizioni",
    publisher: "Comune di Palermo",
    url: "https://opendata.comune.palermo.it/opendata-dataset.php?dataset=265",
    license: "CC BY 4.0 IT",
    refreshCadence: "Municipal updates",
    notes: "Official circoscrizioni shapefile for Palermo."
  },
  {
    id: "genova-unita-urbanistiche",
    name: "Unita Urbanistiche",
    publisher: "Comune di Genova",
    url: "https://geodati.gov.it/resource/id/c_d969%3A79c161ac-0daa-4c74-b75f-eef1ae866ce2",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "WFS layer for Genova urban units; CRS conversion required."
  },
  {
    id: "bologna-aree-statistiche",
    name: "Aree statistiche di Bologna",
    publisher: "Comune di Bologna",
    url: "https://opendata.comune.bologna.it/explore/dataset/aree-statistiche/table/",
    license: "Municipal open data terms",
    refreshCadence: "Municipal updates",
    notes:
      "Ninety statistical areas, finer than the traditional quartiere or zone split."
  },
  {
    id: "firenze-aree-elementari",
    name: "Aree elementari 2021",
    publisher: "Comune di Firenze",
    url: "https://opendata.comune.fi.it/index.php/page_dataset_show?id=aree-elementari-2021",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "Finer Firenze sub-comune layer than official quartieri."
  },
  {
    id: "firenze-quartieri",
    name: "Aree quartieri",
    publisher: "Comune di Firenze",
    url: "https://opendata.comune.fi.it/page_dataset_show?id=5e08844a-c0d8-4d64-a3b2-d1ab58d9283f",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "Polygons for the five official quartieri of Firenze."
  },
  {
    id: "bari-municipi",
    name: "Civilario Unico Comunale",
    publisher: "Comune di Bari",
    url: "https://www.dati.gov.it/node/view-dataset/dataset?id=da2b0e0f-e913-4944-9062-d23aeef7a6c5",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "Prefer current five municipi; quartieri are historical/non-official socio-urbanistic units."
  },
  {
    id: "venezia-dbgt-subcomunale",
    name: "DBGT sub-comunale",
    publisher: "Comune di Venezia",
    url: "https://dati.venezia.it/?q=tag%2Fdbgt",
    license: "IODL 2.0",
    refreshCadence: "Municipal updates",
    notes:
      "Municipalita, Sestiere, Insulario, Quartiere, Localita, Isolato layers; CRS conversion may be required."
  },
  {
    id: "verona-zone-omogenee",
    name: "Zone Omogenee",
    publisher: "Comune di Verona / Regione Veneto open data",
    url: "https://dati.veneto.it/opendata/Comune_di_Verona_Confini_amministrativi_Zone_Omogenee?metadati=showall",
    license: "CC BY 4.0",
    refreshCadence: "Municipal updates",
    notes: "Fine-grained Verona layer with 79 zone omogenee."
  },
  {
    id: "osm-geofabrik-italy",
    name: "OpenStreetMap Italy extract",
    publisher: "Geofabrik / OpenStreetMap contributors",
    url: "https://download.geofabrik.de/europe/italy.html",
    license: "ODbL",
    refreshCadence: "Daily extracts",
    notes: "National source for points of interest and supporting map features."
  }
];
