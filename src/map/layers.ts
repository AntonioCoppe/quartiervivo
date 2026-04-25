import type { ExpressionSpecification } from "maplibre-gl";

export const choroplethColors = {
  low: "#b95454",
  middleLow: "#d97862",
  middle: "#ead5c6",
  middleHigh: "#6f95ac",
  high: "#255f83",
  missing: "#d8d8d8"
} as const;

export function createIncomeColorExpression(
  domain: readonly [number, number],
  property = "value",
  theme: "light" | "dark" = "light"
): ExpressionSpecification {
  const [min, max] = domain;
  const missingColor = theme === "dark" ? "#2f3438" : choroplethColors.missing;

  if (min === max) {
    return [
      "case",
      ["!", ["has", property]],
      missingColor,
      choroplethColors.middle
    ];
  }

  const spread = max - min || 1;
  const q1 = min + spread * 0.25;
  const q2 = min + spread * 0.5;
  const q3 = min + spread * 0.75;

  return [
    "case",
    ["!", ["has", property]],
    missingColor,
    [
      "interpolate",
      ["linear"],
      ["to-number", ["get", property]],
      min,
      choroplethColors.low,
      q1,
      choroplethColors.middleLow,
      q2,
      choroplethColors.middle,
      q3,
      choroplethColors.middleHigh,
      max,
      choroplethColors.high
    ]
  ];
}

export function createExtrusionHeightExpression(
  domain: readonly [number, number],
  property = "value",
  enabled = true
): ExpressionSpecification {
  if (!enabled) {
    return ["case", true, 0, 0];
  }

  const [min, max] = domain;

  if (min === max) {
    return ["case", ["!", ["has", property]], 0, 6000];
  }

  const spread = max - min || 1;

  return [
    "interpolate",
    ["linear"],
    ["to-number", ["get", property]],
    min,
    1800,
    min + spread * 0.5,
    8500,
    max,
    16000
  ];
}
