import { describe, expect, it } from "vitest";
import { nationalSampleAreas } from "../src/data/national/sampleNationalAreas";
import {
  countCoverage,
  findComuneForCity,
  getDisplayAreas,
  getSubareasForComune
} from "../src/domain/hierarchy";

describe("geography hierarchy", () => {
  it("starts with nationwide comuni when no city is focused", () => {
    const displayAreas = getDisplayAreas(nationalSampleAreas, null);

    expect(displayAreas.every((area) => area.areaLevel === "comune")).toBe(true);
    expect(displayAreas.map((area) => area.id)).toContain("comune-058091");
    expect(displayAreas.map((area) => area.id)).toContain("comune-007003");
  });

  it("replaces a covered big city with sub-comune areas", () => {
    const roma = findComuneForCity(nationalSampleAreas, "Roma");
    const displayAreas = getDisplayAreas(nationalSampleAreas, roma?.id ?? null);

    expect(displayAreas.map((area) => area.id)).not.toContain("comune-058091");
    expect(displayAreas.map((area) => area.id)).toContain("subcomune-roma-prati");
    expect(displayAreas.map((area) => area.id)).toContain("comune-007003");
  });

  it("falls back to comuni if a focused comune has no subareas", () => {
    const alba = findComuneForCity(nationalSampleAreas, "Alba");
    const displayAreas = getDisplayAreas(nationalSampleAreas, alba?.id ?? null);

    expect(displayAreas.every((area) => area.areaLevel === "comune")).toBe(true);
    expect(displayAreas.map((area) => area.id)).toContain("comune-004003");
  });

  it("counts national and subcity coverage without mutating input", () => {
    const originalOrder = nationalSampleAreas.map((area) => area.id);

    expect(getSubareasForComune(nationalSampleAreas, "comune-015146")).toHaveLength(2);
    expect(countCoverage(nationalSampleAreas)).toEqual({
      comuni: 7,
      subcomuni: 8,
      bigCitiesWithSubareas: 5
    });
    expect(nationalSampleAreas.map((area) => area.id)).toEqual(originalOrder);
  });
});
