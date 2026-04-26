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
  readonly areaLevel: "comune" | "subcomune";
  readonly parentComuneId?: string;
  readonly istatCode?: string;
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
  readonly subcomuneAreaCount?: number;
  readonly subcomuneGeometryCount?: number;
  readonly withIncomePerCapita: number;
  readonly withPopulation: number;
}

interface AreaFeatureCollectionFixture {
  readonly features: readonly {
    readonly properties?: {
      readonly id?: string;
      readonly areaLevel?: "comune" | "subcomune";
      readonly parentComuneId?: string;
      readonly istatCode?: string;
    };
  }[];
}

const dataDir = join(process.cwd(), "public/data");
function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(dataDir, fileName), "utf8")) as T;
}

describe("generated comune data coverage", () => {
  const areas = readJson<readonly AreaFixture[]>("national-areas.json");
  const areaDetails = readJson<Record<string, AreaDetailFixture>>("area-details.json");
  const coverage = readJson<CoverageFixture>("coverage.json");
  const comuni = areas.filter((area) => area.areaLevel === "comune");

  it("contains a detail payload for every generated comune", () => {
    const duplicateIds = comuni
      .map((area) => area.id)
      .filter((id, index, ids) => ids.indexOf(id) !== index);
    const missingDetailIds = comuni
      .filter((area) => areaDetails[area.id] === undefined)
      .map((area) => area.id);

    expect(comuni.length).toBeGreaterThanOrEqual(7890);
    expect(duplicateIds).toEqual([]);
    expect(missingDetailIds).toEqual([]);
    expect(coverage.comuneCount).toBe(comuni.length);
  });

  it("has complete source-backed values for every displayed comune metric", () => {
    const missingCountsByMetric = Object.fromEntries(
      requiredComuneMetricIds.map((metricId) => {
        const missingCount = comuni.filter((area) => {
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
    expect(coverage.withIncomePerCapita).toBe(comuni.length);
    expect(coverage.withPopulation).toBe(comuni.length);
  });

  it("keeps sparse trend history separate from current metric coverage", () => {
    const missingSeriesByMetric = Object.fromEntries(
      requiredComuneMetricIds.map((metricId) => {
        const missingCount = comuni.filter((area) => {
          const values = areaDetails[area.id]?.metricSeries?.[metricId]?.values ?? [];
          return !values.some(isFiniteMetricValue);
        }).length;

        return [metricId, missingCount];
      })
    );
    const metricsWithNoTrendCoverage = Object.entries(missingSeriesByMetric)
      .filter(([, missingCount]) => missingCount === comuni.length)
      .map(([metricId]) => metricId);
    const currentValueGapsForSparseTrendAreas = comuni
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

  it("splits large Italian cities using the finest available ISTAT ASC features", () => {
    const romaSubareas = areas.filter((area) => area.parentComuneId === "comune-058091");
    const mapAreas = readJson<AreaFeatureCollectionFixture>("areas.geojson");
    const romaMapSubareas = mapAreas.features.filter(
      (feature) => feature.properties?.parentComuneId === "comune-058091"
    );
    const romaParentMapFeature = mapAreas.features.find(
      (feature) => feature.properties?.id === "comune-058091"
    );

    const subareasByParent = areas.reduce<Record<string, number>>((counts, area) => {
      if (!area.parentComuneId) {
        return counts;
      }

      return {
        ...counts,
        [area.parentComuneId]: (counts[area.parentComuneId] ?? 0) + 1
      };
    }, {});

    expect(Object.keys(subareasByParent).length).toBeGreaterThanOrEqual(90);
    expect(coverage.subcomuneAreaCount ?? 0).toBeGreaterThanOrEqual(1500);
    expect(coverage.subcomuneGeometryCount).toBe(coverage.subcomuneAreaCount);
    expect(romaSubareas).toHaveLength(155);
    expect(romaSubareas.every((area) => isFiniteMetricValue(areaDetails[area.id]?.metrics.resident_population ?? null))).toBe(true);
    expect(romaMapSubareas).toHaveLength(155);
    expect(romaParentMapFeature).toBeUndefined();

    for (const istatCode of ["001272", "015146", "010025", "037006", "048017", "063049", "072006", "082053"]) {
      const parentId = `comune-${istatCode}`;
      expect(subareasByParent[parentId]).toBeGreaterThan(1);
      expect(
        mapAreas.features.some((feature) => feature.properties?.parentComuneId === parentId)
      ).toBe(true);
      expect(
        mapAreas.features.some((feature) => feature.properties?.id === parentId)
      ).toBe(false);
    }
  });
});

function isFiniteMetricValue(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}
