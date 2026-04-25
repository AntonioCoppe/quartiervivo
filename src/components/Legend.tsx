import { createLegendStops, formatMetricValue, getLocalizedText, getMetricColorStops } from "../domain/metrics";
import type { LocaleCode, MetricDefinition } from "../types/geography";

interface LegendProps {
  readonly domain: readonly [number, number];
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
}

export function Legend({ domain, locale, metric }: LegendProps) {
  const colorStops = getMetricColorStops(metric, domain);
  const stops = metric.colorStops?.length
    ? [colorStops[0], colorStops[Math.floor(colorStops.length / 2)], colorStops[colorStops.length - 1]]
    : createLegendStops(domain, 3);

  return (
    <div className="legend" aria-label="Map legend">
      <span>{getLocalizedText(metric.shortLabel, locale)}</span>
      <div className="legend-ramp" aria-hidden="true" />
      {stops.map((stop, index) => (
        <b key={`${stop}-${index}`}>{formatMetricValue(stop, metric, locale)}</b>
      ))}
      <span className="na-dot" aria-hidden="true" />
      <span>{locale === "it" ? "N/D" : "N/A"}</span>
    </div>
  );
}
