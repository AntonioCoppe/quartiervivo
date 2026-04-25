import { describe, expect, it } from "vitest";
import { dataSources } from "../src/data/dataSources";

describe("data source manifest", () => {
  it("keeps source entries attributable", () => {
    expect(dataSources.length).toBeGreaterThanOrEqual(6);

    for (const source of dataSources) {
      expect(source.id).toMatch(/^[a-z0-9-]+$/);
      expect(source.name.length).toBeGreaterThan(4);
      expect(source.publisher.length).toBeGreaterThan(2);
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.license.length).toBeGreaterThan(1);
      expect(source.notes.length).toBeGreaterThan(10);
    }
  });

  it("includes the required MVP source families", () => {
    const ids = new Set(dataSources.map((source) => source.id));

    expect(ids.has("mef-irpef-comune")).toBe(true);
    expect(ids.has("mef-irpef-subcomune-cap")).toBe(true);
    expect(ids.has("istat-basi-territoriali")).toBe(true);
    expect(ids.has("istat-admin-boundaries")).toBe(true);
    expect(ids.has("istat-comuni-codes")).toBe(true);
    expect(ids.has("istat-posas-comuni")).toBe(true);
    expect(ids.has("osm-geofabrik-italy")).toBe(true);
  });
});
