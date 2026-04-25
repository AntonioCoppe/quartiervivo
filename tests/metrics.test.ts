import { describe, expect, it } from "vitest";
import { sampleAreas } from "../src/data/sampleAreas";
import { metrics } from "../src/data/metrics";
import {
  createLegendStops,
  findMetricValue,
  formatMetricValue,
  getMetricDomain,
  getMetricColorStops,
  rankAreas
} from "../src/domain/metrics";

describe("metric helpers", () => {
  it("finds metric values without requiring callers to inspect raw metrics", () => {
    expect(findMetricValue(sampleAreas[0], "income_per_taxpayer")).toBe(34850);
    expect(findMetricValue(sampleAreas[0], "missing_metric")).toBeNull();
  });

  it("computes the numeric domain for the selected metric", () => {
    expect(getMetricDomain(sampleAreas, "income_per_taxpayer")).toEqual([17120, 45120]);
    expect(getMetricDomain(sampleAreas, "missing_metric")).toEqual([0, 0]);
  });

  it("ranks areas without mutating the original input order", () => {
    const originalOrder = sampleAreas.map((area) => area.id);
    const topAreas = rankAreas(sampleAreas, "income_per_taxpayer", "desc", 3);
    const bottomAreas = rankAreas(sampleAreas, "income_per_taxpayer", "asc", 2);

    expect(topAreas.map((entry) => entry.area.id)).toEqual([
      "milano-brera",
      "roma-prati",
      "bologna-saragozza"
    ]);
    expect(bottomAreas.map((entry) => entry.area.id)).toEqual([
      "napoli-sanita",
      "milano-lorenteggio"
    ]);
    expect(sampleAreas.map((area) => area.id)).toEqual(originalOrder);
  });

  it("formats metric values for the UI", () => {
    const incomeMetric = metrics.find((metric) => metric.id === "income_per_taxpayer") ?? metrics[0];
    expect(formatMetricValue(30524, incomeMetric)).toBe("30.524€");
    expect(formatMetricValue(null, incomeMetric)).toBe("N/D");
    expect(formatMetricValue(Number.NaN, incomeMetric, "en")).toBe("N/A");
    expect(
      formatMetricValue(42.445, {
        ...incomeMetric,
        unit: "percent"
      })
    ).toBe("42,4%");
    expect(
      formatMetricValue(1234.56, {
        ...incomeMetric,
        unit: "count"
      })
    ).toBe("1.234,6");
  });

  it("creates stable legend stops", () => {
    expect(createLegendStops([10000, 30000], 3)).toEqual([10000, 20000, 30000]);
    expect(createLegendStops([5, 5], 3)).toEqual([5, 5, 5]);
    expect(createLegendStops([10, 20], 1)).toEqual([10]);
  });

  it("uses fixed income stops when the metric declares them", () => {
    const incomeMetric = metrics.find((metric) => metric.id === "income_per_capita") ?? metrics[0];

    expect(getMetricColorStops(incomeMetric, [10000, 50000])).toEqual([
      8000,
      12000,
      16000,
      20000,
      24000,
      28000
    ]);
  });
});
