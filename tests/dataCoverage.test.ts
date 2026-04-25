import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { requiredComuneMetricIds } from "../scripts/lib/data-coverage.mjs";

interface MetricValueFixture {
  readonly metricId: string;
  readonly value: number | null;
  readonly year: number;
}

interface AreaFixture {
  readonly id: string;
  readonly metrics: readonly MetricValueFixture[];
}

interface AreaDetailFixture {
  readonly metrics: Record<string, number | null>;
  readonly metricSeries?: Record<string, {
    readonly values: readonly (number | null)[];
  }>;
}

interface CoverageFixture {
  readonly comuneCount: number;
  readonly withIncomePerCapita: number;
  readonly withPopulation: number;
}

const dataDir = join(process.cwd(), "public/data");
function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(dataDir, fileName), "utf8")) as T;
}

describe("generated comune data coverage", () => {
  const areas = readJson<readonly AreaFixture[]>("national-areas.json");
  const areaDetails = readJson<Record<string, AreaDetailFixture>>("area-details.json");
  const coverage = readJson<CoverageFixture>("coverage.json");

  it("contains a detail payload for every generated comune", () => {
    const duplicateIds = areas
      .map((area) => area.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index);
    const missingDetailIds = areas
      .filter((area) => areaDetails[area.id] === undefined)
      .map((area) => area.id);

    expect(areas.length).toBeGreaterThanOrEqual(7890);
    expect(duplicateIds).toEqual([]);
    expect(missingDetailIds).toEqual([]);
    expect(coverage.comuneCount).toBe(areas.length);
  });

  it("has complete source-backed values for every displayed comune metric", () => {
    const missingCountsByMetric = Object.fromEntries(
      requiredComuneMetricIds.map((metricId) => {
        const missingCount = areas.filter((area) => {
          const areaValue = area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
          const detailValue = areaDetails[area.id]?.metrics[metricId] ?? null;

          return !isFiniteMetricValue(areaValue) || !isFiniteMetricValue(detailValue);
        }).length;

        return [metricId, missingCount];
      })
    );

    expect(missingCountsByMetric).toEqual(
      Object.fromEntries(requiredComuneMetricIds.map((metricId) => [metricId, 0]))
    );
    expect(coverage.withIncomePerCapita).toBe(areas.length);
    expect(coverage.withPopulation).toBe(areas.length);
  });

  it("keeps sparse trend history separate from current metric coverage", () => {
    const missingSeriesByMetric = Object.fromEntries(
      requiredComuneMetricIds.map((metricId) => {
        const missingCount = areas.filter((area) => {
          const values = areaDetails[area.id]?.metricSeries?.[metricId]?.values ?? [];
          return !values.some(isFiniteMetricValue);
        }).length;

        return [metricId, missingCount];
      })
    );
    const metricsWithNoTrendCoverage = Object.entries(missingSeriesByMetric)
      .filter(([, missingCount]) => missingCount === areas.length)
      .map(([metricId]) => metricId);
    const currentValueGapsForSparseTrendAreas = areas
      .flatMap((area) =>
        requiredComuneMetricIds.map((metricId) => {
          const values = areaDetails[area.id]?.metricSeries?.[metricId]?.values ?? [];
          const hasSeries = values.some(isFiniteMetricValue);
          const areaValue = area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
          const detailValue = areaDetails[area.id]?.metrics[metricId] ?? null;

          return {
            areaId: area.id,
            metricId,
            hasCurrentValue: isFiniteMetricValue(areaValue) && isFiniteMetricValue(detailValue),
            hasSeries
          };
        })
      )
      .filter((entry) => !entry.hasSeries && !entry.hasCurrentValue);

    expect(metricsWithNoTrendCoverage).toEqual([]);
    expect(currentValueGapsForSparseTrendAreas).toEqual([]);
  });
});

function isFiniteMetricValue(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}
