import { describe, expect, it } from "vitest";
import {
  auditComuneDataCoverage,
  requiredComuneMetricIds
} from "../scripts/lib/data-coverage.mjs";

const completeAreas = [
  {
    id: "comune-001001",
    metrics: requiredComuneMetricIds.map((metricId, index) => ({
      metricId,
      value: index + 1,
      year: 2024
    }))
  }
];

const completeDetails = {
  "comune-001001": {
    metrics: Object.fromEntries(
      requiredComuneMetricIds.map((metricId, index) => [metricId, index + 1])
    ),
    metricSeries: Object.fromEntries(
      requiredComuneMetricIds.map((metricId, index) => [
        metricId,
        { years: [2024], values: [index + 1] }
      ])
    )
  }
};

const completeCoverage = {
  comuneCount: 1,
  withIncomePerCapita: 1,
  withPopulation: 1
};

describe("comune data coverage audit", () => {
  it("passes complete current metric coverage", () => {
    const audit = auditComuneDataCoverage({
      areas: completeAreas,
      areaDetails: completeDetails,
      coverage: completeCoverage
    });

    expect(audit.ok).toBe(true);
    expect(audit.failures).toEqual([]);
  });

  it("fails when a comune is missing a current source-backed value", () => {
    const areas = [
      {
        ...completeAreas[0],
        metrics: completeAreas[0].metrics.map((metric) =>
          metric.metricId === "income_per_capita" ? { ...metric, value: null } : metric
        )
      }
    ];
    const audit = auditComuneDataCoverage({
      areas,
      areaDetails: completeDetails,
      coverage: completeCoverage
    });

    expect(audit.ok).toBe(false);
    expect(audit.failures.join("\n")).toContain("income_per_capita missing");
  });

  it("reports sparse historical series without failing current coverage", () => {
    const areaDetails = {
      "comune-001001": {
        ...completeDetails["comune-001001"],
        metricSeries: {
          ...completeDetails["comune-001001"].metricSeries,
          income_per_capita: { years: [], values: [] }
        }
      }
    };
    const audit = auditComuneDataCoverage({
      areas: completeAreas,
      areaDetails,
      coverage: completeCoverage
    });

    expect(audit.ok).toBe(true);
    expect(audit.summary.missingSeries).toBe(1);
    expect(audit.summary.missingSeriesExamples).toEqual(["comune-001001:income_per_capita"]);
  });
});
