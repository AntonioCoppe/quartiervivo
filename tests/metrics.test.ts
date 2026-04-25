import { describe, expect, it } from "vitest";
import { sampleAreas } from "../src/data/sampleAreas";
import { metrics } from "../src/data/metrics";
import {
  createLegendStops,
  findMetricValue,
  formatMetricValue,
  getMetricDomain,
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
    expect(formatMetricValue(30524, metrics[0])).toBe("30.524 EUR");
    expect(formatMetricValue(null, metrics[0])).toBe("N/A");
    expect(formatMetricValue(Number.NaN, metrics[0])).toBe("N/A");
    expect(
      formatMetricValue(42.445, {
        ...metrics[0],
        unit: "percent"
      })
    ).toBe("42,4%");
    expect(
      formatMetricValue(1234.56, {
        ...metrics[0],
        unit: "count"
      })
    ).toBe("1.234,6");
  });

  it("creates stable legend stops", () => {
    expect(createLegendStops([10000, 30000], 3)).toEqual([10000, 20000, 30000]);
    expect(createLegendStops([5, 5], 3)).toEqual([5, 5, 5]);
    expect(createLegendStops([10, 20], 1)).toEqual([10]);
  });
});
