import { Download, Share2, X } from "lucide-react";
import { formatMetricValue, getLocalizedText } from "../domain/metrics";
import type { AreaDetail, LocaleCode, MetricDefinition } from "../types/geography";

interface DetailsPanelProps {
  readonly detail: AreaDetail;
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly metrics: readonly MetricDefinition[];
  readonly onClose: () => void;
}

const labels = {
  en: {
    areaKind: "COMUNE",
    population: "Population",
    income: "Average income",
    employment: "Employment rate",
    foreignBorn: "Foreign-born",
    education: "Higher education",
    gini: "Inequality (Gini)",
    age: "Age structure",
    origin: "Foreign-born by region",
    sector: "Economic sectors",
    source: "Source",
    share: "Share as card",
    close: "Close panel",
    missing: "Not available in current local dataset"
  },
  it: {
    areaKind: "COMUNE",
    population: "Popolazione",
    income: "Reddito medio",
    employment: "Tasso occupazione",
    foreignBorn: "Nati all'estero",
    education: "Istr. superiore",
    gini: "Disuguaglianza (Gini)",
    age: "Struttura di eta",
    origin: "Nati all'estero per regione",
    sector: "Settori economici",
    source: "Fonte",
    share: "Condividi come card",
    close: "Chiudi pannello",
    missing: "Non disponibile nel dataset locale attuale"
  }
} as const;

export function DetailsPanel({ detail, locale, metric, metrics, onClose }: DetailsPanelProps) {
  const copy = labels[locale];
  const populationMetric = findMetric(metrics, "resident_population") ?? metric;
  const incomeMetric = findMetric(metrics, "income_per_taxpayer") ?? metric;
  const employmentMetric = findMetric(metrics, "employment_rate") ?? metric;
  const educationMetric = findMetric(metrics, "higher_education_percent") ?? metric;

  return (
    <aside className="details-panel" aria-label="Selected area details">
      <div className="details-header">
        <span>{copy.areaKind}</span>
        <button type="button" aria-label={copy.share} onClick={() => shareAreaCard(detail, locale, metrics)}>
          <Share2 size={14} aria-hidden="true" />
        </button>
        <button type="button" aria-label={copy.close} onClick={onClose}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <h2>{detail.name}</h2>
      <p>
        {detail.province ? `${detail.province} · ` : ""}
        {detail.region}
      </p>

      <div className="detail-metric hero">
        <span>{copy.population}</span>
        <strong>{formatMetricValue(detail.metrics.resident_population ?? null, populationMetric, locale)}</strong>
        <em>{populationMetric.year}</em>
      </div>

      <div className="detail-grid">
        <MetricTile label={copy.income} value={detail.metrics.income_per_taxpayer ?? null} metric={incomeMetric} locale={locale} />
        <MetricTile label={copy.employment} value={detail.metrics.employment_rate ?? null} metric={employmentMetric} locale={locale} />
        <MetricTile label={copy.foreignBorn} value={null} metric={{ ...metric, unit: "percent" }} locale={locale} />
        <MetricTile label={copy.education} value={detail.metrics.higher_education_percent ?? null} metric={educationMetric} locale={locale} />
        <MetricTile label={copy.gini} value={null} metric={{ ...metric, unit: "index" }} locale={locale} />
      </div>

      <Breakdown title={copy.age} rows={[
        ["<15", detail.ageStructure.under15],
        ["15-64", detail.ageStructure.age15To64],
        ["65+", detail.ageStructure.age65Plus]
      ]} />
      <Breakdown title={copy.origin} rows={[
        ["Europe", detail.originBreakdown.europe],
        ["Africa", detail.originBreakdown.africa],
        ["Americas", detail.originBreakdown.americas],
        ["Asia", detail.originBreakdown.asia]
      ]} />
      <Breakdown title={copy.sector} rows={[
        ["Agriculture", detail.sectorBreakdown.agriculture],
        ["Industry", detail.sectorBreakdown.industry],
        ["Construction", detail.sectorBreakdown.construction],
        ["Services", detail.sectorBreakdown.services]
      ]} />

      <footer>
        <strong>{copy.source}</strong>
        <span>{detail.sourceIds?.join(", ") ?? copy.missing}</span>
      </footer>
    </aside>
  );
}

interface MetricTileProps {
  readonly label: string;
  readonly value: number | null;
  readonly metric: MetricDefinition;
  readonly locale: LocaleCode;
}

function MetricTile({ label, value, metric, locale }: MetricTileProps) {
  return (
    <div className="detail-metric">
      <span>{label}</span>
      <strong>{formatMetricValue(value, metric, locale)}</strong>
      <em>{metric.year}</em>
    </div>
  );
}

interface BreakdownProps {
  readonly title: string;
  readonly rows: readonly (readonly [string, number | null])[];
}

function Breakdown({ title, rows }: BreakdownProps) {
  return (
    <section className="breakdown">
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div className="breakdown-row" key={label}>
          <span>{label}</span>
          <div>
            <i style={{ width: `${Math.max(value ?? 0, 2)}%` }} />
          </div>
          <b>{value === null ? "N/D" : `${value.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`}</b>
        </div>
      ))}
    </section>
  );
}

function findMetric(metrics: readonly MetricDefinition[], metricId: string): MetricDefinition | undefined {
  return metrics.find((candidate) => candidate.id === metricId);
}

function shareAreaCard(detail: AreaDetail, locale: LocaleCode, metrics: readonly MetricDefinition[]) {
  const populationMetric = findMetric(metrics, "resident_population");
  const incomeMetric = findMetric(metrics, "income_per_taxpayer");
  const population = populationMetric
    ? formatMetricValue(detail.metrics.resident_population ?? null, populationMetric, locale)
    : "N/D";
  const income = incomeMetric
    ? formatMetricValue(detail.metrics.income_per_taxpayer ?? null, incomeMetric, locale)
    : "N/D";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
  <rect width="900" height="520" fill="#111418"/>
  <rect x="36" y="36" width="828" height="448" rx="22" fill="#f8f5ef"/>
  <text x="78" y="112" font-family="Menlo, monospace" font-size="22" fill="#85817a">MappaQuartieri</text>
  <text x="78" y="190" font-family="Menlo, monospace" font-size="54" font-weight="800" fill="#17191c">${escapeXml(detail.name)}</text>
  <text x="78" y="242" font-family="Menlo, monospace" font-size="24" fill="#67615b">${escapeXml(detail.region)}</text>
  <text x="78" y="342" font-family="Menlo, monospace" font-size="22" fill="#85817a">Population</text>
  <text x="78" y="392" font-family="Menlo, monospace" font-size="42" font-weight="800" fill="#17191c">${population}</text>
  <text x="474" y="342" font-family="Menlo, monospace" font-size="22" fill="#85817a">Income</text>
  <text x="474" y="392" font-family="Menlo, monospace" font-size="42" font-weight="800" fill="#17191c">${income}</text>
</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${detail.id}-mappaquartieri-card.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const replacements: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      "\"": "&quot;"
    };

    return replacements[character] ?? character;
  });
}
