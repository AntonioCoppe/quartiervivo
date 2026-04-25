import type {
  AreaDetail,
  LocaleCode,
  LocalizedText,
  MetricDefinition,
  MetricSeries,
  NeighborhoodArea,
  RankedArea
} from "../types/geography";

export const incomeColorStops = [8000, 12000, 16000, 20000, 24000, 28000] as const;

export function getLocalizedText(text: LocalizedText, locale: LocaleCode): string {
  return text[locale] ?? text.en;
}

export function findMetricValue(area: NeighborhoodArea, metricId: string): number | null {
  return area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
}

export function getMetricDomain(
  areas: readonly NeighborhoodArea[],
  metricId: string
): readonly [number, number] {
  const values = areas
    .map((area) => findMetricValue(area, metricId))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length === 0) {
    return [0, 0];
  }

  return [Math.min(...values), Math.max(...values)];
}

export function rankAreas(
  areas: readonly NeighborhoodArea[],
  metricId: string,
  direction: "asc" | "desc",
  limit: number
): readonly RankedArea[] {
  const sorted = areas
    .map((area) => ({ area, value: findMetricValue(area, metricId) }))
    .filter((entry): entry is { area: NeighborhoodArea; value: number } => entry.value !== null)
    .sort((left, right) =>
      direction === "asc" ? left.value - right.value : right.value - left.value
    )
    .slice(0, limit);

  return sorted.map((entry, index) => ({
    area: entry.area,
    value: entry.value,
    rank: index + 1
  }));
}

export function formatMetricValue(
  value: number | null,
  metric: MetricDefinition,
  locale: LocaleCode = "it"
): string {
  if (value === null || Number.isNaN(value)) {
    return locale === "it" ? "N/D" : "N/A";
  }

  if (metric.unit === "EUR") {
    return `${Math.round(value).toLocaleString(locale === "it" ? "it-IT" : "en-US")}€`;
  }

  if (metric.unit === "percent") {
    return `${value.toLocaleString(locale === "it" ? "it-IT" : "en-US", { maximumFractionDigits: 1 })}%`;
  }

  return value.toLocaleString(locale === "it" ? "it-IT" : "en-US", {
    maximumFractionDigits: metric.unit === "index" ? 2 : 1,
    useGrouping: true
  });
}

export function createLegendStops(domain: readonly [number, number], count = 5): readonly number[] {
  const [min, max] = domain;

  if (count < 2) {
    return [min];
  }

  if (min === max) {
    return Array.from({ length: count }, () => min);
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(min + step * index));
}

export function getMetricColorStops(
  metric: Pick<MetricDefinition, "colorStops" | "id" | "unit">,
  domain: readonly [number, number]
): readonly number[] {
  if (metric.colorStops?.length) {
    return metric.colorStops;
  }

  if (metric.unit === "EUR" && metric.id.includes("income")) {
    return incomeColorStops;
  }

  return createLegendStops(domain, 6);
}

export function getMetricSeries(detail: AreaDetail, metricId: string): MetricSeries | null {
  return detail.metricSeries?.[metricId] ?? null;
}

export function getSeriesDelta(series: MetricSeries | null): {
  readonly absolute: number | null;
  readonly relativePercent: number | null;
} {
  if (!series) {
    return { absolute: null, relativePercent: null };
  }

  const values = series.values.filter((value): value is number => value !== null && Number.isFinite(value));

  if (values.length < 2) {
    return { absolute: null, relativePercent: null };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const absolute = last - first;

  return {
    absolute,
    relativePercent: first === 0 ? null : (absolute / first) * 100
  };
}

export function formatTrendDelta(
  series: MetricSeries | null,
  metric: Pick<MetricDefinition, "unit">,
  locale: LocaleCode = "it"
): string {
  const delta = getSeriesDelta(series);

  if (delta.absolute === null) {
    return locale === "it" ? "N/D" : "N/A";
  }

  if (metric.unit === "percent") {
    const value = delta.absolute.toLocaleString(locale === "it" ? "it-IT" : "en-US", {
      maximumFractionDigits: 1,
      signDisplay: "always"
    });
    return `${value}pp`;
  }

  if (delta.relativePercent === null) {
    return delta.absolute.toLocaleString(locale === "it" ? "it-IT" : "en-US", {
      maximumFractionDigits: 1,
      signDisplay: "always"
    });
  }

  const value = delta.relativePercent.toLocaleString(locale === "it" ? "it-IT" : "en-US", {
    maximumFractionDigits: 1,
    signDisplay: "always"
  });
  return `${value}%`;
}
