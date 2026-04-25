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

const currentIncomeYear = 2024;
const currentPopulationYear = 2025;
const incomeYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const populationYears = [2021, 2022, 2023, 2024, 2025];
const incomeStops = [8000, 12000, 16000, 20000, 24000, 28000];

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
    year: currentPopulationYear,
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
    year: currentPopulationYear,
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
    year: currentPopulationYear,
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
    year: currentPopulationYear,
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
    year: currentPopulationYear,
    sourceId: "istat-posas-comuni",
    granularity: "municipality",
    tileProperty: "age_under_15_percent",
    description: {
      en: "Share of residents younger than 15.",
      it: "Quota di residenti con meno di 15 anni."
    }
  },
  {
    id: "income_per_capita",
    group: "income",
    label: { en: "Declared income per capita (€)", it: "Reddito dichiarato pro capite (€)" },
    shortLabel: { en: "Income per capita", it: "Reddito pro capite" },
    unit: "EUR",
    year: currentIncomeYear,
    sourceId: "mef-irpef-comune",
    granularity: "municipality",
    tileProperty: "income_per_capita",
    colorStops: incomeStops,
    description: {
      en: "MEF total declared income divided by ISTAT resident population for the same comune where both sources are available.",
      it: "Reddito complessivo dichiarato MEF diviso per popolazione residente ISTAT dello stesso comune quando entrambe le fonti sono disponibili."
    }
  },
  {
    id: "income_per_taxpayer",
    group: "income",
    label: { en: "Average income per taxpayer (€)", it: "Reddito medio per contribuente (€)" },
    shortLabel: { en: "Income/taxpayer", it: "Reddito/contrib." },
    unit: "EUR",
    year: currentIncomeYear,
    sourceId: "mef-irpef-comune",
    granularity: "municipality",
    tileProperty: "income_per_taxpayer",
    colorStops: incomeStops,
    description: {
      en: "MEF total declared income divided by taxpayer count.",
      it: "Reddito complessivo dichiarato MEF diviso per numero di contribuenti."
    }
  },
  {
    id: "taxpayer_count",
    group: "income",
    label: { en: "Taxpayers", it: "Contribuenti" },
    shortLabel: { en: "Taxpayers", it: "Contribuenti" },
    unit: "count",
    year: currentIncomeYear,
    sourceId: "mef-irpef-comune",
    granularity: "municipality",
    tileProperty: "taxpayer_count",
    description: {
      en: "Number of taxpayers in the MEF municipal declarations file.",
      it: "Numero di contribuenti nel file comunale delle dichiarazioni MEF."
    }
  },
  {
    id: "taxpayer_share_percent",
    group: "income",
    label: { en: "Taxpayers per resident (%)", it: "Contribuenti per residente (%)" },
    shortLabel: { en: "Taxpayer share", it: "Quota contrib." },
    unit: "percent",
    year: currentIncomeYear,
    sourceId: "mef-irpef-comune",
    granularity: "municipality",
    tileProperty: "taxpayer_share_percent",
    description: {
      en: "Taxpayer count divided by resident population. This is not an employment rate.",
      it: "Numero di contribuenti diviso per popolazione residente. Non e un tasso di occupazione."
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

  if (!identifierFile) {
    throw new Error("Missing data/raw/Elenco-comuni-italiani.csv. Run npm run data:fetch or place it manually.");
  }

  const identifiers = parseDelimited(await readTextAuto(identifierFile));
  const incomeByYear = await createIndexByYear(files, incomeYears, findIncomeFile, createIncomeIndex);
  const populationByYear = await createIndexByYear(files, populationYears, findPopulationFile, createPopulationIndex);
  const currentIncomeByIstat = incomeByYear.get(currentIncomeYear) ?? new Map();
  const currentPopulationByIstat = populationByYear.get(currentPopulationYear) ?? new Map();

  const areas = identifiers
    .map((row) => {
      const istatCode = firstPresent(row, codeCandidates)?.padStart(6, "0") ?? null;

      if (!istatCode) {
        return null;
      }

      const cadastralCode = firstPresent(row, cadastralCandidates);
      const income = findIncomeRecord(currentIncomeByIstat, istatCode, cadastralCode);
      const populationProfile = currentPopulationByIstat.get(istatCode) ?? getLatestPopulation(populationByYear, istatCode);
      const population = populationProfile?.population ?? null;
      const populationForIncome =
        populationByYear.get(currentIncomeYear)?.get(istatCode)?.population ?? population;
      const incomePerCapita =
        income?.totalIncome && populationForIncome ? Math.round(income.totalIncome / populationForIncome) : null;
      const taxpayerSharePercent =
        income?.taxpayers && populationForIncome ? roundMetric((income.taxpayers / populationForIncome) * 100) : null;
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
            metricId: "income_per_capita",
            value: incomePerCapita,
            year: currentIncomeYear
          },
          {
            metricId: "income_per_taxpayer",
            value: income?.averageIncome ?? null,
            year: currentIncomeYear
          },
          {
            metricId: "taxpayer_count",
            value: income?.taxpayers ?? null,
            year: currentIncomeYear
          },
          {
            metricId: "taxpayer_share_percent",
            value: taxpayerSharePercent,
            year: currentIncomeYear
          },
          {
            metricId: "resident_population",
            value: population,
            year: currentPopulationYear
          },
          {
            metricId: "gender_ratio",
            value: populationProfile?.genderRatio ?? null,
            year: currentPopulationYear
          },
          {
            metricId: "age_65_plus_percent",
            value: populationProfile?.age65PlusPercent ?? null,
            year: currentPopulationYear
          },
          {
            metricId: "age_15_64_percent",
            value: populationProfile?.age1564Percent ?? null,
            year: currentPopulationYear
          },
          {
            metricId: "age_under_15_percent",
            value: populationProfile?.ageUnder15Percent ?? null,
            year: currentPopulationYear
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

  const nationalSeries = createNationalSeries(areas, incomeByYear, populationByYear);
  const coverage = {
    generatedAt: new Date().toISOString(),
    nationalAreaLevel: "comune",
    comuneCount: areas.length,
    withIncome: areas.filter((area) => hasMetricValue(area, "income_per_taxpayer")).length,
    withIncomePerCapita: areas.filter((area) => hasMetricValue(area, "income_per_capita")).length,
    withPopulation: areas.filter((area) => area.population !== null).length,
    withIncomeHistory: areas.filter((area) =>
      createAreaSeries(area, incomeByYear, populationByYear, nationalSeries).income_per_taxpayer.values
        .filter((value) => value !== null).length > 1
    ).length,
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
        istatCode: area.istatCode,
        province: area.province,
        areaLevel: area.areaLevel,
        granularity: area.granularity,
        sourceIds: area.sourceIds,
        metrics: Object.fromEntries(area.metrics.map((metric) => [metric.metricId, metric.value])),
        metricSeries: createAreaSeries(area, incomeByYear, populationByYear, nationalSeries),
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

async function createIndexByYear(files, years, findFile, createIndex) {
  const entries = new Map();

  for (const year of years) {
    const file = findFile(files, year);

    if (!file) {
      continue;
    }

    entries.set(year, createIndex(parseDelimited(await readTextAuto(file))));
  }

  return entries;
}

function findIncomeFile(files, year) {
  return files.find((file) =>
    new RegExp(`Redditi_e_principali_variabili_IRPEF_su_base_comunale_CSV_${year}.*\\.csv$`, "i").test(file)
  );
}

function findPopulationFile(files, year) {
  return files.find((file) => new RegExp(`POSAS_${year}_it_Comuni\\.csv$`, "i").test(file));
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
    const totalIncome =
      parseItalianNumber(firstPresent(row, totalIncomeAmountCandidates)) ?? sumIncomeBands(row);

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

function sumIncomeBands(row) {
  const values = Object.entries(row)
    .filter(([key]) =>
      key.startsWith("reddito_complessivo_") &&
      key.endsWith("_ammontare_in_euro") &&
      key !== "reddito_complessivo_ammontare_in_euro"
    )
    .map(([, value]) => parseItalianNumber(value))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function createPopulationIndex(rows) {
  const entries = new Map();
  const profiles = new Map();

  for (const row of rows) {
    const istatCode = firstPresent(row, [...codeCandidates, "ref_area"])?.padStart(6, "0");
    const ageValue = firstPresent(row, ["eta", "age"]);
    const age = ageValue === "999" || ageValue === "Totale" || ageValue === "totale" ? 999 : Number(ageValue);
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

    profiles.set(istatCode, {
      ...profile,
      under15: profile.under15 + (age < 15 ? population : 0),
      age15To64: profile.age15To64 + (age >= 15 && age <= 64 ? population : 0),
      age65Plus: profile.age65Plus + (age >= 65 ? population : 0)
    });
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

function createNationalSeries(areas, incomeByYear, populationByYear) {
  return {
    resident_population: {
      years: populationYears,
      values: populationYears.map((year) => sumPopulation(areas, populationByYear.get(year)))
    },
    income_per_capita: {
      years: incomeYears,
      values: incomeYears.map((year) => calculateNationalIncomePerCapita(areas, incomeByYear.get(year), populationByYear.get(year)))
    },
    income_per_taxpayer: {
      years: incomeYears,
      values: incomeYears.map((year) => calculateNationalIncomePerTaxpayer(areas, incomeByYear.get(year)))
    },
    taxpayer_count: {
      years: incomeYears,
      values: incomeYears.map((year) => sumTaxpayers(areas, incomeByYear.get(year)))
    },
    taxpayer_share_percent: {
      years: incomeYears,
      values: incomeYears.map((year) => {
        const taxpayers = sumTaxpayers(areas, incomeByYear.get(year));
        const population = sumPopulation(areas, populationByYear.get(year));
        return taxpayers && population ? roundMetric((taxpayers / population) * 100) : null;
      })
    }
  };
}

function createAreaSeries(area, incomeByYear, populationByYear, nationalSeries) {
  const incomePerCapita = incomeYears.map((year) => {
    const income = findIncomeRecord(incomeByYear.get(year), area.istatCode, area.cadastralCode);
    const population = populationByYear.get(year)?.get(area.istatCode)?.population ?? null;
    return income?.totalIncome && population ? Math.round(income.totalIncome / population) : null;
  });
  const incomePerTaxpayer = incomeYears.map((year) =>
    findIncomeRecord(incomeByYear.get(year), area.istatCode, area.cadastralCode)?.averageIncome ?? null
  );
  const taxpayerCount = incomeYears.map((year) =>
    findIncomeRecord(incomeByYear.get(year), area.istatCode, area.cadastralCode)?.taxpayers ?? null
  );
  const population = populationYears.map((year) =>
    populationByYear.get(year)?.get(area.istatCode)?.population ?? null
  );
  const taxpayerShare = incomeYears.map((year) => {
    const taxpayers = findIncomeRecord(incomeByYear.get(year), area.istatCode, area.cadastralCode)?.taxpayers ?? null;
    const residents = populationByYear.get(year)?.get(area.istatCode)?.population ?? null;
    return taxpayers && residents ? roundMetric((taxpayers / residents) * 100) : null;
  });

  return {
    resident_population: {
      years: populationYears,
      values: population,
      nationalValues: nationalSeries.resident_population.values
    },
    income_per_capita: {
      years: incomeYears,
      values: incomePerCapita,
      nationalValues: nationalSeries.income_per_capita.values
    },
    income_per_taxpayer: {
      years: incomeYears,
      values: incomePerTaxpayer,
      nationalValues: nationalSeries.income_per_taxpayer.values
    },
    taxpayer_count: {
      years: incomeYears,
      values: taxpayerCount,
      nationalValues: nationalSeries.taxpayer_count.values
    },
    taxpayer_share_percent: {
      years: incomeYears,
      values: taxpayerShare,
      nationalValues: nationalSeries.taxpayer_share_percent.values
    }
  };
}

function sumPopulation(areas, populationIndex) {
  if (!populationIndex) {
    return null;
  }

  const total = areas.reduce((sum, area) => sum + (populationIndex.get(area.istatCode)?.population ?? 0), 0);
  return total > 0 ? total : null;
}

function sumTaxpayers(areas, incomeIndex) {
  if (!incomeIndex) {
    return null;
  }

  const total = areas.reduce((sum, area) => {
    const income = findIncomeRecord(incomeIndex, area.istatCode, area.cadastralCode);
    return sum + (income?.taxpayers ?? 0);
  }, 0);

  return total > 0 ? total : null;
}

function calculateNationalIncomePerCapita(areas, incomeIndex, populationIndex) {
  if (!incomeIndex || !populationIndex) {
    return null;
  }

  const totals = areas.reduce(
    (current, area) => {
      const income = findIncomeRecord(incomeIndex, area.istatCode, area.cadastralCode);
      const population = populationIndex.get(area.istatCode)?.population ?? null;

      return {
        totalIncome: current.totalIncome + (income?.totalIncome ?? 0),
        population: current.population + (population ?? 0)
      };
    },
    { totalIncome: 0, population: 0 }
  );

  return totals.totalIncome && totals.population ? Math.round(totals.totalIncome / totals.population) : null;
}

function calculateNationalIncomePerTaxpayer(areas, incomeIndex) {
  if (!incomeIndex) {
    return null;
  }

  const totals = areas.reduce(
    (current, area) => {
      const income = findIncomeRecord(incomeIndex, area.istatCode, area.cadastralCode);

      return {
        totalIncome: current.totalIncome + (income?.totalIncome ?? 0),
        taxpayers: current.taxpayers + (income?.taxpayers ?? 0)
      };
    },
    { totalIncome: 0, taxpayers: 0 }
  );

  return totals.totalIncome && totals.taxpayers ? Math.round(totals.totalIncome / totals.taxpayers) : null;
}

function getLatestPopulation(populationByYear, istatCode) {
  return [...populationByYear.entries()]
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([, index]) => index.get(istatCode))
    .find(Boolean) ?? null;
}

function findIncomeRecord(index, istatCode, cadastralCode) {
  return index?.get(istatCode) ?? (cadastralCode ? index?.get(cadastralCode) : null) ?? null;
}

function findMetricValue(area, metricId) {
  return area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
}

function hasMetricValue(area, metricId) {
  const value = findMetricValue(area, metricId);
  return value !== null && Number.isFinite(value);
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
