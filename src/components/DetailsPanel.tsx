import { Share2, X } from "lucide-react";
import {
  formatMetricValue,
  formatTrendDelta,
  getLocalizedText,
  getMetricSeries
} from "../domain/metrics";
import type { AreaDetail, LocaleCode, MetricDefinition, MetricSeries } from "../types/geography";

interface DetailsPanelProps {
  readonly detail: AreaDetail;
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly metrics: readonly MetricDefinition[];
  readonly onClose: () => void;
}

const labels = {
  en: {
    areaKind: "MUNICIPALITY",
    code: "Code",
    population: "Population",
    income: "Income",
    employment: "Employment rate",
    foreignBorn: "Foreign-born",
    education: "Higher education",
    gini: "Inequality (Gini)",
    age: "Age structure",
    under15: "Under 15",
    age15To64: "15-64",
    age65Plus: "65+",
    origin: "Foreign-born by region",
    europe: "Europe",
    africa: "Africa",
    americas: "Americas",
    asia: "Asia",
    sector: "Economic sectors",
    agriculture: "Agriculture",
    industry: "Industry",
    construction: "Construction",
    services: "Services",
    italy: "Italy",
    available: "Available indicators",
    unavailable: "Not loaded in this bundle",
    unavailableExplanation: "Employment, foreign-born, higher education, Gini, origin, and sector tables need additional census sources and remain hidden until those files are loaded.",
    source: "Source",
    share: "Share as card",
    close: "Close panel",
    missing: "Not available from the current local source bundle"
  },
  it: {
    areaKind: "COMUNE",
    code: "Codice",
    population: "Popolazione",
    income: "Reddito",
    employment: "Tasso occupazione",
    foreignBorn: "Nati all'estero",
    education: "Istruzione superiore",
    gini: "Disuguaglianza (Gini)",
    age: "Struttura di eta",
    under15: "Sotto 15",
    age15To64: "15-64",
    age65Plus: "65+",
    origin: "Nati all'estero per regione",
    europe: "Europa",
    africa: "Africa",
    americas: "Americhe",
    asia: "Asia",
    sector: "Settori economici",
    agriculture: "Agricoltura",
    industry: "Industria",
    construction: "Costruzioni",
    services: "Servizi",
    italy: "Italia",
    available: "Indicatori disponibili",
    unavailable: "Non caricati in questo bundle",
    unavailableExplanation: "Occupazione, nati all'estero, istruzione superiore, Gini, origine e settori richiedono fonti censuarie aggiuntive e restano nascosti finche quei file non sono caricati.",
    source: "Fonte",
    share: "Condividi come card",
    close: "Chiudi pannello",
    missing: "Non disponibile nel bundle locale attuale"
  }
} as const;

export function DetailsPanel({ detail, locale, metric, metrics, onClose }: DetailsPanelProps) {
  const copy = labels[locale];
  const populationMetric = findMetric(metrics, "resident_population") ?? metric;
  const incomeMetric = metric.group === "income"
    ? metric
    : findMetric(metrics, "income_per_capita") ?? findMetric(metrics, "income_per_taxpayer") ?? metric;
  const availableTiles = createAvailableTiles(detail, metrics, metric, incomeMetric.id);
  const unavailableLabels = [copy.employment, copy.foreignBorn, copy.education, copy.gini, copy.origin, copy.sector];

  return (
    <aside className="details-panel" aria-label="Selected area details">
      <div className="details-header">
        <span>{copy.areaKind}</span>
        <button type="button" aria-label={copy.share} onClick={() => void shareAreaCard(detail, locale, metrics)}>
          <Share2 size={16} aria-hidden="true" />
        </button>
        <button type="button" aria-label={copy.close} onClick={onClose}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="details-title">
        <h2>{detail.name}</h2>
        <p>{copy.code} {detail.istatCode ?? detail.id.replace(/^comune-/, "")}</p>
      </div>

      <TrendMetric
        detail={detail}
        label={copy.population}
        locale={locale}
        metric={populationMetric}
        metricId="resident_population"
        nationalLabel={copy.italy}
      />

      <TrendMetric
        detail={detail}
        label={getLocalizedText(incomeMetric.label, locale)}
        locale={locale}
        metric={incomeMetric}
        metricId={incomeMetric.id}
        nationalLabel={copy.italy}
      />

      <section className="available-block" aria-label={copy.available}>
        <h3>{copy.available}</h3>
        <div className="detail-grid">
          {availableTiles.map((tile) => (
            <TrendTile
              detail={detail}
              key={tile.metric.id}
              label={getLocalizedText(tile.metric.label, locale)}
              locale={locale}
              metric={tile.metric}
              metricId={tile.metric.id}
              nationalLabel={copy.italy}
            />
          ))}
        </div>
      </section>

      <AgeStructure
        labels={[copy.under15, copy.age15To64, copy.age65Plus]}
        locale={locale}
        title={copy.age}
        values={[
          detail.ageStructure.under15,
          detail.ageStructure.age15To64,
          detail.ageStructure.age65Plus
        ]}
      />

      <UnavailableDataNotice
        explanation={copy.unavailableExplanation}
        labels={unavailableLabels}
        title={copy.unavailable}
      />

      <footer>
        <strong>{copy.source}</strong>
        <span>{detail.sourceIds?.join(", ") ?? copy.missing}</span>
      </footer>
    </aside>
  );
}

function createAvailableTiles(
  detail: AreaDetail,
  metrics: readonly MetricDefinition[],
  fallback: MetricDefinition,
  primaryIncomeMetricId: string
) {
  return [
    primaryIncomeMetricId === "income_per_taxpayer" ? "income_per_capita" : "income_per_taxpayer",
    "taxpayer_share_percent",
    "age_65_plus_percent",
    "gender_ratio"
  ]
    .map((metricId) => findMetric(metrics, metricId) ?? syntheticMetric(metricId, metricId === "gender_ratio" ? "index" : "percent", fallback))
    .filter((candidate) => detail.metrics[candidate.id] !== null && detail.metrics[candidate.id] !== undefined)
    .slice(0, 4)
    .map((metric) => ({ metric }));
}

interface TrendMetricProps {
  readonly detail: AreaDetail;
  readonly label: string;
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly metricId: string;
  readonly nationalLabel: string;
}

function TrendMetric({ detail, label, locale, metric, metricId, nationalLabel }: TrendMetricProps) {
  const series = getMetricSeries(detail, metricId);
  const value = detail.metrics[metricId] ?? getLastSeriesValue(series);
  const delta = formatTrendDelta(series, metric, locale);
  const trendClass = delta.startsWith("-") ? "down" : "up";

  return (
    <section className="detail-trend hero">
      <div className="detail-trend-label">{label}</div>
      <div className="detail-value-line">
        <strong>{formatMetricValue(value, metric, locale)}</strong>
        <em className={trendClass}>{delta}</em>
      </div>
      <Sparkline series={series} />
      <SeriesYears series={series} />
      {series?.nationalValues?.some((item) => item !== null) ? (
        <span className="national-key">--- {nationalLabel}</span>
      ) : null}
    </section>
  );
}

function TrendTile(props: TrendMetricProps) {
  const series = getMetricSeries(props.detail, props.metricId);
  const value = props.detail.metrics[props.metricId] ?? getLastSeriesValue(series);
  const delta = formatTrendDelta(series, props.metric, props.locale);

  return (
    <section className="detail-trend tile">
      <div className="detail-trend-label">{props.label}</div>
      <div className="detail-value-line compact">
        <strong>{formatMetricValue(value, props.metric, props.locale)}</strong>
        <em className={delta.startsWith("-") ? "down" : "up"}>{delta}</em>
      </div>
      <Sparkline series={series} compact />
      {series?.nationalValues?.some((item) => item !== null) ? (
        <span className="national-key">--- {props.nationalLabel}</span>
      ) : null}
    </section>
  );
}

function UnavailableDataNotice({
  explanation,
  labels: itemLabels,
  title
}: {
  readonly explanation: string;
  readonly labels: readonly string[];
  readonly title: string;
}) {
  return (
    <section className="unavailable-data">
      <h3>{title}</h3>
      <p>{explanation}</p>
      <div>
        {itemLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}

function Sparkline({ series, compact = false }: { readonly series: MetricSeries | null; readonly compact?: boolean }) {
  const values = series?.values ?? [];
  const nationalValues = series?.nationalValues ?? [];
  const combinedValues = [...values, ...nationalValues].filter((value): value is number => value !== null && Number.isFinite(value));

  if (combinedValues.length < 2 || !series) {
    return <div className={compact ? "sparkline compact empty" : "sparkline empty"} />;
  }

  const min = Math.min(...combinedValues);
  const max = Math.max(...combinedValues);
  const range = max - min || 1;
  const width = 220;
  const height = compact ? 46 : 72;
  const points = createPolyline(values, min, range, width, height);
  const nationalPoints = createPolyline(nationalValues, min, range, width, height);

  return (
    <svg className={compact ? "sparkline compact" : "sparkline"} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {nationalPoints ? <polyline className="sparkline-national" points={nationalPoints} /> : null}
      {points ? <polyline className="sparkline-local" points={points} /> : null}
      {points ? <circle className="sparkline-dot" {...getLastPoint(points)} r="2.2" /> : null}
    </svg>
  );
}

function SeriesYears({ series }: { readonly series: MetricSeries | null }) {
  if (!series) {
    return null;
  }

  const firstIndex = series.values.findIndex((value) => value !== null);
  const lastIndex = findLastValueIndex(series.values);

  if (firstIndex < 0 || lastIndex < 0) {
    return null;
  }

  return (
    <div className="series-years">
      <span>{series.years[firstIndex]}</span>
      <span>{series.years[lastIndex]}</span>
    </div>
  );
}

function AgeStructure({
  labels: rowLabels,
  locale,
  title,
  values
}: {
  readonly labels: readonly string[];
  readonly locale: LocaleCode;
  readonly title: string;
  readonly values: readonly (number | null)[];
}) {
  const safeValues = values.map((value) => value ?? 0);

  return (
    <section className="age-structure">
      <h3>{title}</h3>
      <div className="age-stack" aria-hidden="true">
        <i style={{ width: `${safeValues[0]}%` }} />
        <i style={{ width: `${safeValues[1]}%` }} />
        <i style={{ width: `${safeValues[2]}%` }} />
      </div>
      {rowLabels.map((label, index) => (
        <div className="age-row" key={label}>
          <span className={`age-swatch age-${index}`} />
          <span>{label}</span>
          <b>{formatPercent(values[index], locale)}</b>
        </div>
      ))}
    </section>
  );
}

interface BreakdownProps {
  readonly title: string;
  readonly locale: LocaleCode;
  readonly rows: readonly (readonly [string, number | null])[];
}

function Breakdown({ title, locale, rows }: BreakdownProps) {
  return (
    <section className="breakdown">
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div className="breakdown-row" key={label}>
          <span>{label}</span>
          <div>
            <i style={{ width: `${Math.max(value ?? 0, value === null ? 0 : 2)}%` }} />
          </div>
          <b>{formatPercent(value, locale)}</b>
        </div>
      ))}
    </section>
  );
}

function createPolyline(
  values: readonly (number | null)[],
  min: number,
  range: number,
  width: number,
  height: number
): string | null {
  const points = values
    .map((value, index) => {
      if (value === null || !Number.isFinite(value)) {
        return null;
      }

      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter((point): point is string => point !== null);

  return points.length > 1 ? points.join(" ") : null;
}

function getLastPoint(points: string) {
  const allPoints = points.split(" ");
  const [x = "0", y = "0"] = allPoints[allPoints.length - 1]?.split(",") ?? [];
  return { cx: Number(x), cy: Number(y) };
}

function getLastSeriesValue(series: MetricSeries | null): number | null {
  if (!series) {
    return null;
  }

  for (let index = series.values.length - 1; index >= 0; index -= 1) {
    const value = series.values[index];

    if (value !== null && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function findLastValueIndex(values: readonly (number | null)[]): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null) {
      return index;
    }
  }

  return -1;
}

function formatPercent(value: number | null, locale: LocaleCode): string {
  if (value === null || !Number.isFinite(value)) {
    return locale === "it" ? "N/D" : "N/A";
  }

  return `${value.toLocaleString(locale === "it" ? "it-IT" : "en-US", { maximumFractionDigits: 1 })}%`;
}

function findMetric(metrics: readonly MetricDefinition[], metricId: string): MetricDefinition | undefined {
  return metrics.find((candidate) => candidate.id === metricId);
}

function syntheticMetric(
  id: string,
  unit: MetricDefinition["unit"],
  fallback: MetricDefinition
): MetricDefinition {
  return {
    ...fallback,
    id,
    unit,
    tileProperty: id
  };
}

async function shareAreaCard(detail: AreaDetail, locale: LocaleCode, metrics: readonly MetricDefinition[]) {
  const blob = await renderAreaCard(detail, locale, metrics);
  const fileName = `${detail.id}-mappaquartieri-card.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: detail.name });
    return;
  }

  if (navigator.clipboard && "ClipboardItem" in window) {
    await navigator.clipboard.write([
      new window.ClipboardItem({ "image/png": blob })
    ]);
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function renderAreaCard(
  detail: AreaDetail,
  locale: LocaleCode,
  metrics: readonly MetricDefinition[]
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 560;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas unavailable.");
  }

  const populationMetric = findMetric(metrics, "resident_population") ?? metrics[0];
  const incomeMetric = findMetric(metrics, "income_per_capita") ?? findMetric(metrics, "income_per_taxpayer") ?? metrics[0];

  context.fillStyle = "#111418";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7f7f5";
  roundedRect(context, 44, 44, 872, 472, 18);
  context.fill();

  context.fillStyle = "#8d9297";
  context.font = "20px Menlo, monospace";
  context.fillText("MappaQuartieri", 86, 116);
  context.fillStyle = "#17191c";
  context.font = "700 54px Menlo, monospace";
  context.fillText(detail.name.slice(0, 24), 86, 194);
  context.fillStyle = "#646a70";
  context.font = "22px Menlo, monospace";
  context.fillText([detail.province, detail.region].filter(Boolean).join(" · "), 86, 246);
  context.fillStyle = "#8d9297";
  context.font = "18px Menlo, monospace";
  context.fillText(locale === "it" ? "Popolazione" : "Population", 86, 346);
  context.fillText(getLocalizedText(incomeMetric.shortLabel, locale), 504, 346);
  context.fillStyle = "#17191c";
  context.font = "700 40px Menlo, monospace";
  context.fillText(formatMetricValue(detail.metrics.resident_population ?? null, populationMetric, locale), 86, 398);
  context.fillText(formatMetricValue(detail.metrics[incomeMetric.id] ?? null, incomeMetric, locale), 504, 398);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Unable to render share card."));
    }, "image/png");
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
