import type {
  LocaleCode,
  LocalizedText,
  MetricDefinition,
  NeighborhoodArea,
  RankedArea
} from "../types/geography";

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
