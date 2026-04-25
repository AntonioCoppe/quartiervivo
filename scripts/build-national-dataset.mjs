import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  firstPresent,
  parseDelimited,
  parseItalianNumber
} from "./lib/csv.mjs";

const rawDir = new URL("../data/raw/", import.meta.url);
const outputDir = new URL("../public/data/", import.meta.url);
const processedDir = new URL("../data/processed/", import.meta.url);

const codeCandidates = [
  "codice_comune_formato_alfanumerico",
  "codice_comune",
  "pro_com_t",
  "codice_istat_comune",
  "codice_istat"
];

const cadastralCandidates = ["codice_catastale_del_comune", "codice_catastale", "codice_belfiore"];
const comuneNameCandidates = ["denominazione_in_italiano", "denominazione_comune", "comune"];
const provinceCandidates = ["sigla_automobilistica", "sigla_provincia", "provincia"];
const regionCandidates = ["denominazione_regione", "regione"];
const taxpayersCandidates = ["numero_contribuenti", "frequenza_numero_contribuenti"];
const totalIncomeCandidates = ["reddito_complessivo_ammontare", "reddito_complessivo"];
const totalIncomeAmountCandidates = [
  "reddito_complessivo_ammontare_in_euro",
  "reddito_complessivo_ammontare",
  "reddito_complessivo"
];
const populationCandidates = ["totale", "value", "obs_value", "popolazione", "popolazione_residente"];

const metricCatalog = [
  {
    id: "resident_population",
    group: "population",
    label: { en: "Total population", it: "Popolazione totale" },
    shortLabel: { en: "Population", it: "Popolazione" },
    unit: "count",
    year: 2025,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "resident_population",
    description: {
      en: "Resident population count from ISTAT POSAS.",
      it: "Popolazione residente da ISTAT POSAS."
    }
  },
  {
    id: "gender_ratio",
    group: "population",
    label: { en: "Gender ratio (M:F)", it: "Rapporto uomini/donne" },
    shortLabel: { en: "Gender ratio", it: "Rapporto M/F" },
    unit: "index",
    year: 2025,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "gender_ratio",
    description: {
      en: "Number of males per 100 females.",
      it: "Numero di uomini ogni 100 donne."
    }
  },
  {
    id: "age_65_plus_percent",
    group: "population",
    label: { en: "Population aged 65+ (%)", it: "Popolazione 65+ (%)" },
    shortLabel: { en: "65+", it: "65+" },
    unit: "percent",
    year: 2025,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "age_65_plus_percent",
    description: {
      en: "Share of residents aged 65 or older.",
      it: "Quota di residenti con almeno 65 anni."
    }
  },
  {
    id: "age_15_64_percent",
    group: "population",
    label: { en: "Population aged 15-64 (%)", it: "Popolazione 15-64 (%)" },
    shortLabel: { en: "15-64", it: "15-64" },
    unit: "percent",
    year: 2025,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "age_15_64_percent",
    description: {
      en: "Share of residents aged 15 to 64.",
      it: "Quota di residenti tra 15 e 64 anni."
    }
  },
  {
    id: "age_under_15_percent",
    group: "population",
    label: { en: "Population under 15 (%)", it: "Popolazione sotto i 15 anni (%)" },
    shortLabel: { en: "Under 15", it: "Under 15" },
    unit: "percent",
    year: 2025,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "age_under_15_percent",
    description: {
      en: "Share of residents younger than 15.",
      it: "Quota di residenti con meno di 15 anni."
    }
  },
  {
    id: "income_per_taxpayer",
    group: "income",
    label: { en: "Average income per taxpayer (€)", it: "Reddito medio per contribuente (€)" },
    shortLabel: { en: "Income", it: "Reddito" },
    unit: "EUR",
    year: 2024,
    sourceId: "mef-irpef-comune",
    granularity: "municipality",
    tileProperty: "income_per_taxpayer",
    description: {
      en: "MEF total income divided by taxpayer count.",
      it: "Reddito complessivo MEF diviso per numero di contribuenti."
    }
  },
  {
    id: "employment_rate",
    group: "employment",
    label: { en: "Employment rate (%)", it: "Tasso di occupazione (%)" },
    shortLabel: { en: "Employment", it: "Occupazione" },
    unit: "percent",
    year: 2023,
    sourceId: "istat-census-sections",
    granularity: "census_section",
    tileProperty: "employment_rate",
    description: {
      en: "Census-section employment metric. Not available in the current local raw bundle.",
      it: "Metrica di occupazione per sezione censuaria. Non disponibile nel bundle locale attuale."
    }
  },
  {
    id: "services_employment_percent",
    group: "employment",
    label: { en: "Services employment (%)", it: "Occupazione nei servizi (%)" },
    shortLabel: { en: "Services", it: "Servizi" },
    unit: "percent",
    year: 2023,
    sourceId: "istat-census-sections",
    granularity: "census_section",
    tileProperty: "services_employment_percent",
    description: {
      en: "Share of employed residents working in services. Not available in the current local raw bundle.",
      it: "Quota di occupati nei servizi. Non disponibile nel bundle locale attuale."
    }
  },
  {
    id: "higher_education_percent",
    group: "education",
    label: { en: "Population with higher education (%)", it: "Popolazione con istruzione superiore (%)" },
    shortLabel: { en: "Higher ed.", it: "Istr. superiore" },
    unit: "percent",
    year: 2023,
    sourceId: "istat-census-sections",
    granularity: "census_section",
    tileProperty: "higher_education_percent",
    description: {
      en: "Higher-education attainment metric. Not available in the current local raw bundle.",
      it: "Metrica sul titolo di studio superiore. Non disponibile nel bundle locale attuale."
    }
  },
  {
    id: "primary_education_or_below_percent",
    group: "education",
    label: { en: "Primary education or below (%)", it: "Istruzione primaria o inferiore (%)" },
    shortLabel: { en: "Primary or below", it: "Primaria o meno" },
    unit: "percent",
    year: 2023,
    sourceId: "istat-census-sections",
    granularity: "census_section",
    tileProperty: "primary_education_or_below_percent",
    description: {
      en: "Primary-or-below attainment metric. Not available in the current local raw bundle.",
      it: "Metrica sul titolo di studio primario o inferiore. Non disponibile nel bundle locale attuale."
    }
  }
];

async function main() {
  await mkdir(outputDir, { recursive: true });
  await mkdir(processedDir, { recursive: true });

  const files = await listFiles(rawDir.pathname).catch(() => []);
  const identifierFile = files.find((file) => /Elenco-comuni-italiani\.csv$/i.test(file));
  const incomeFile = files.find((file) => /base_comunale.*\.csv$/i.test(file));
  const populationFile = files.find((file) => /POS|POP/i.test(file) && /\.csv$/i.test(file));

  if (!identifierFile) {
    throw new Error("Missing data/raw/Elenco-comuni-italiani.csv. Run npm run data:fetch or place it manually.");
  }

  const identifiers = parseDelimited(await readTextAuto(identifierFile));
  const incomeRows = incomeFile
    ? parseDelimited(await readTextAuto(incomeFile))
    : [];
  const populationRows = populationFile
    ? parseDelimited(await readTextAuto(populationFile))
    : [];

  const incomeByIstat = createIncomeIndex(incomeRows);
  const populationByIstat = createPopulationIndex(populationRows);
  const areas = identifiers
    .map((row) => {
      const istatCode = firstPresent(row, codeCandidates)?.padStart(6, "0") ?? null;

      if (!istatCode) {
        return null;
      }

      const cadastralCode = firstPresent(row, cadastralCandidates);
      const income = incomeByIstat.get(istatCode) ?? (cadastralCode ? incomeByIstat.get(cadastralCode) : null);
      const populationProfile = populationByIstat.get(istatCode) ?? null;
      const population = populationProfile?.population ?? null;
      const name = firstPresent(row, comuneNameCandidates) ?? istatCode;
      const region = firstPresent(row, regionCandidates) ?? "";

      return {
        id: `comune-${istatCode}`,
        name,
        city: name,
        region,
        areaLevel: "comune",
        granularity: "municipality",
        istatCode,
        cadastralCode,
        province: firstPresent(row, provinceCandidates),
        population,
        sourceIds: ["istat-comuni-codes", "mef-irpef-comune", "istat-posas-comuni"],
        metrics: [
          {
            metricId: "income_per_taxpayer",
            value: income?.averageIncome ?? null,
            year: 2024
          },
          {
            metricId: "resident_population",
            value: population,
            year: 2025
          },
          {
            metricId: "gender_ratio",
            value: populationProfile?.genderRatio ?? null,
            year: 2025
          },
          {
            metricId: "age_65_plus_percent",
            value: populationProfile?.age65PlusPercent ?? null,
            year: 2025
          },
          {
            metricId: "age_15_64_percent",
            value: populationProfile?.age1564Percent ?? null,
            year: 2025
          },
          {
            metricId: "age_under_15_percent",
            value: populationProfile?.ageUnder15Percent ?? null,
            year: 2025
          },
          {
            metricId: "employment_rate",
            value: null,
            year: 2023
          },
          {
            metricId: "services_employment_percent",
            value: null,
            year: 2023
          },
          {
            metricId: "higher_education_percent",
            value: null,
            year: 2023
          },
          {
            metricId: "primary_education_or_below_percent",
            value: null,
            year: 2023
          }
        ]
      };
    })
    .filter(Boolean);

  const coverage = {
    generatedAt: new Date().toISOString(),
    nationalAreaLevel: "comune",
    comuneCount: areas.length,
    withIncome: areas.filter((area) => area.metrics.some((metric) => metric.metricId === "income_per_taxpayer" && metric.value !== null)).length,
    withPopulation: areas.filter((area) => area.population !== null).length,
    subcomuneCityCount: 0
  };
  const detailRecords = Object.fromEntries(
    areas.map((area) => [
      area.id,
      {
        id: area.id,
        name: area.name,
        city: area.city,
        region: area.region,
        province: area.province,
        areaLevel: area.areaLevel,
        granularity: area.granularity,
        sourceIds: area.sourceIds,
        metrics: Object.fromEntries(area.metrics.map((metric) => [metric.metricId, metric.value])),
        ageStructure: {
          under15: findMetricValue(area, "age_under_15_percent"),
          age15To64: findMetricValue(area, "age_15_64_percent"),
          age65Plus: findMetricValue(area, "age_65_plus_percent")
        },
        originBreakdown: {
          europe: null,
          africa: null,
          americas: null,
          asia: null
        },
        sectorBreakdown: {
          agriculture: null,
          industry: null,
          construction: null,
          services: findMetricValue(area, "services_employment_percent")
        }
      }
    ])
  );

  await writeFile(join(outputDir.pathname, "national-areas.json"), `${JSON.stringify(areas, null, 2)}\n`);
  await writeFile(join(outputDir.pathname, "catalog.json"), `${JSON.stringify({ metricGroups: createMetricGroups(), metrics: metricCatalog }, null, 2)}\n`);
  await writeFile(join(outputDir.pathname, "area-details.json"), `${JSON.stringify(detailRecords, null, 2)}\n`);
  await writeFile(join(outputDir.pathname, "coverage.json"), `${JSON.stringify(coverage, null, 2)}\n`);
  console.log(coverage);
}

async function readTextAuto(file) {
  const buffer = await readFile(file);
  const utf8 = buffer.toString("utf8");

  if (!utf8.includes("\uFFFD")) {
    return utf8;
  }

  return buffer.toString("latin1");
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : fullPath;
    })
  );

  return files.flat();
}

function createIncomeIndex(rows) {
  const entries = new Map();

  for (const row of rows) {
    const istatCode = firstPresent(row, codeCandidates)?.padStart(6, "0");
    const cadastralCode = firstPresent(row, cadastralCandidates);
    const taxpayers = parseItalianNumber(firstPresent(row, taxpayersCandidates));
    const totalIncome = parseItalianNumber(firstPresent(row, totalIncomeAmountCandidates));

    if (!taxpayers || !totalIncome) {
      continue;
    }

    const value = {
      taxpayers,
      totalIncome,
      averageIncome: Math.round(totalIncome / taxpayers)
    };

    if (istatCode) {
      entries.set(istatCode, value);
    }

    if (cadastralCode) {
      entries.set(cadastralCode, value);
    }
  }

  return entries;
}

function createPopulationIndex(rows) {
  const entries = new Map();
  const profiles = new Map();

  for (const row of rows) {
    const istatCode = firstPresent(row, [...codeCandidates, "ref_area"])?.padStart(6, "0");
    const ageValue = firstPresent(row, ["eta", "age"]);
    const age = ageValue === "999" ? 999 : Number(ageValue);
    const population = parseItalianNumber(firstPresent(row, populationCandidates));
    const male = parseItalianNumber(firstPresent(row, ["totale_maschi", "maschi", "male"]));
    const female = parseItalianNumber(firstPresent(row, ["totale_femmine", "femmine", "female"]));

    if (!istatCode || population === null || !Number.isFinite(age)) {
      continue;
    }

    const profile = profiles.get(istatCode) ?? {
      population: null,
      male: null,
      female: null,
      under15: 0,
      age15To64: 0,
      age65Plus: 0
    };

    if (age === 999) {
      profiles.set(istatCode, {
        ...profile,
        population,
        male,
        female
      });
      continue;
    }

    const nextProfile = {
      ...profile,
      under15: profile.under15 + (age < 15 ? population : 0),
      age15To64: profile.age15To64 + (age >= 15 && age <= 64 ? population : 0),
      age65Plus: profile.age65Plus + (age >= 65 ? population : 0)
    };
    profiles.set(istatCode, nextProfile);
  }

  for (const [istatCode, profile] of profiles) {
    const population = profile.population ?? profile.under15 + profile.age15To64 + profile.age65Plus;
    const genderRatio = profile.male !== null && profile.female
      ? roundMetric((profile.male / profile.female) * 100)
      : null;

    entries.set(istatCode, {
      population,
      genderRatio,
      ageUnder15Percent: population ? roundMetric((profile.under15 / population) * 100) : null,
      age1564Percent: population ? roundMetric((profile.age15To64 / population) * 100) : null,
      age65PlusPercent: population ? roundMetric((profile.age65Plus / population) * 100) : null
    });
  }

  return entries;
}

function findMetricValue(area, metricId) {
  return area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
}

function roundMetric(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function createMetricGroups() {
  return [
    { id: "population", label: { en: "Population", it: "Popolazione" } },
    { id: "income", label: { en: "Income", it: "Reddito" } },
    { id: "employment", label: { en: "Employment", it: "Occupazione" } },
    { id: "education", label: { en: "Education", it: "Istruzione" } }
  ];
}

await main();
