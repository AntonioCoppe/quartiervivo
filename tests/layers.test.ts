import { describe, expect, it } from "vitest";
import {
  choroplethColors,
  createExtrusionHeightExpression,
  createIncomeColorExpression
} from "../src/map/layers";

describe("map layer expressions", () => {
  it("creates a color expression with missing-data fallback", () => {
    const expression = createIncomeColorExpression([10000, 30000]);

    expect(expression).toContain(choroplethColors.missing);
    expect(JSON.stringify(expression)).toContain(choroplethColors.low);
    expect(JSON.stringify(expression)).toContain(choroplethColors.high);
  });

  it("creates an extrusion expression from a numeric domain", () => {
    const expression = createExtrusionHeightExpression([10000, 30000]);

    expect(expression).toEqual([
      "interpolate",
      ["linear"],
      ["to-number", ["get", "value"]],
      10000,
      1800,
      20000,
      8500,
      30000,
      16000
    ]);
  });

  it("keeps layer expressions valid when all values are equal", () => {
    expect(createIncomeColorExpression([20000, 20000])).toEqual([
      "case",
      ["!", ["has", "value"]],
      choroplethColors.missing,
      choroplethColors.middle
    ]);
    expect(createExtrusionHeightExpression([20000, 20000])).toEqual([
      "case",
      ["!", ["has", "value"]],
      0,
      6000
    ]);
  });
});
