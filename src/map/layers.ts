import type { ExpressionSpecification } from "maplibre-gl";

export const choroplethColors = {
  low: "#b95454",
  middleLow: "#d97862",
  middle: "#ead5c6",
  middleHigh: "#6f95ac",
  high: "#255f83",
  missing: "#d8d8d8"
} as const;

export const hoverHighlightColors = {
  light: "#f2c94c",
  dark: "#ffe176"
} as const;

export function createIncomeColorExpression(
  domain: readonly [number, number],
  property = "value",
  theme: "light" | "dark" = "light",
  stops?: readonly number[]
): ExpressionSpecification {
  const [min, max] = domain;
  const missingColor = theme === "dark" ? "#2f3438" : choroplethColors.missing;
  const colorStops = stops?.length ? stops : null;
  const numericStops = colorStops
    ? [
        colorStops[0],
        colorStops[Math.max(1, Math.floor((colorStops.length - 1) * 0.25))],
        colorStops[Math.max(1, Math.floor((colorStops.length - 1) * 0.5))],
        colorStops[Math.max(1, Math.floor((colorStops.length - 1) * 0.75))],
        colorStops[colorStops.length - 1]
      ]
    : [min, min + ((max - min || 1) * 0.25), min + ((max - min || 1) * 0.5), min + ((max - min || 1) * 0.75), max];

  if (!colorStops && min === max) {
    return [
      "case",
      ["any", ["!", ["has", property]], ["==", ["get", property], null]],
      missingColor,
      choroplethColors.middle
    ];
  }

  return [
    "case",
    ["any", ["!", ["has", property]], ["==", ["get", property], null]],
    missingColor,
    [
      "interpolate",
      ["linear"],
      ["to-number", ["get", property]],
      numericStops[0],
      choroplethColors.low,
      numericStops[1],
      choroplethColors.middleLow,
      numericStops[2],
      choroplethColors.middle,
      numericStops[3],
      choroplethColors.middleHigh,
      numericStops[4] ?? numericStops[3],
      choroplethColors.high
    ]
  ];
}

export function createHoverColorExpression(
  baseExpression: ExpressionSpecification,
  theme: "light" | "dark" = "light"
): ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    hoverHighlightColors[theme],
    baseExpression
  ];
}

export function createExtrusionHeightExpression(
  domain: readonly [number, number],
  property = "value",
  enabled = true,
  stops?: readonly number[]
): ExpressionSpecification {
  if (!enabled) {
    return ["case", true, 0, 0];
  }

  const [min, max] = domain;
  const heightStops = stops?.length
    ? [stops[0], stops[Math.floor((stops.length - 1) / 2)], stops[stops.length - 1]]
    : [min, min + ((max - min || 1) * 0.5), max];

  if (!stops?.length && min === max) {
    return [
      "case",
      ["any", ["!", ["has", property]], ["==", ["get", property], null], ["<=", ["to-number", ["get", property]], 0]],
      0,
      6000
    ];
  }

  return [
    "case",
    ["any", ["!", ["has", property]], ["==", ["get", property], null], ["<=", ["to-number", ["get", property]], 0]],
    0,
    [
      "interpolate",
      ["linear"],
      ["to-number", ["get", property]],
      heightStops[0],
      400,
      heightStops[1],
      9000,
      heightStops[2],
      36000
    ]
  ];
}
