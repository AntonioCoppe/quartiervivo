export const requiredComuneMetricIds = [
  "income_per_capita",
  "income_per_taxpayer",
  "taxpayer_count",
  "taxpayer_share_percent",
  "resident_population",
  "gender_ratio",
  "age_65_plus_percent",
  "age_15_64_percent",
  "age_under_15_percent"
];

export function auditComuneDataCoverage({ areas, areaDetails, coverage }) {
  const missingByMetric = Object.fromEntries(
    requiredComuneMetricIds.map((metricId) => [metricId, []])
  );
  const missingDetails = [];
  const missingSeries = [];
  const duplicateIds = findDuplicates(areas.map((area) => area.id));

  for (const area of areas) {
    const detail = areaDetails[area.id];

    if (!detail) {
      missingDetails.push(area.id);
    }

    for (const metricId of requiredComuneMetricIds) {
      const areaValue = area.metrics.find((metric) => metric.metricId === metricId)?.value ?? null;
      const detailValue = detail?.metrics?.[metricId] ?? null;
      const areaHasValue = areaValue !== null && Number.isFinite(areaValue);
      const detailHasValue = detailValue !== null && Number.isFinite(detailValue);
      const seriesValues = detail?.metricSeries?.[metricId]?.values ?? [];
      const hasSeries = seriesValues.some((value) => value !== null && Number.isFinite(value));

      if (!areaHasValue || !detailHasValue) {
        missingByMetric[metricId].push(area.id);
      }

      if (!hasSeries) {
        missingSeries.push(`${area.id}:${metricId}`);
      }
    }
  }

  const failures = [
    coverage?.comuneCount === areas.length ? null : `coverage.comuneCount=${coverage?.comuneCount ?? "missing"} does not match areas.length=${areas.length}`,
    coverage?.withIncomePerCapita === areas.length ? null : `coverage.withIncomePerCapita=${coverage?.withIncomePerCapita ?? "missing"} does not match areas.length=${areas.length}`,
    coverage?.withPopulation === areas.length ? null : `coverage.withPopulation=${coverage?.withPopulation ?? "missing"} does not match areas.length=${areas.length}`,
    duplicateIds.length ? `duplicate area ids: ${duplicateIds.slice(0, 10).join(", ")}` : null,
    missingDetails.length ? `missing detail records: ${missingDetails.slice(0, 10).join(", ")}` : null,
    ...Object.entries(missingByMetric).map(([metricId, ids]) =>
      ids.length ? `${metricId} missing for ${ids.length} comuni: ${ids.slice(0, 10).join(", ")}` : null
    )
  ].filter(Boolean);

  return {
    ok: failures.length === 0,
    failures,
    summary: {
      comuneCount: areas.length,
      requiredMetricIds: requiredComuneMetricIds,
      missingCountsByMetric: Object.fromEntries(
        Object.entries(missingByMetric).map(([metricId, ids]) => [metricId, ids.length])
      ),
      missingDetails: missingDetails.length,
      missingSeriesExamples: missingSeries.slice(0, 10),
      missingSeries: missingSeries.length
    }
  };
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}
