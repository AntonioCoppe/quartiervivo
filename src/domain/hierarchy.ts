import type { NeighborhoodArea } from "../types/geography";

export function getSubareasForComune(
  areas: readonly NeighborhoodArea[],
  comuneId: string
): readonly NeighborhoodArea[] {
  return areas.filter(
    (area) => area.areaLevel === "subcomune" && area.parentComuneId === comuneId
  );
}

export function getDisplayAreas(
  areas: readonly NeighborhoodArea[],
  focusedComuneId: string | null
): readonly NeighborhoodArea[] {
  if (!focusedComuneId) {
    return areas.filter((area) => area.areaLevel === "comune");
  }

  const subareas = getSubareasForComune(areas, focusedComuneId);

  if (subareas.length === 0) {
    return areas.filter((area) => area.areaLevel === "comune");
  }

  return [
    ...areas.filter((area) => area.areaLevel === "comune" && area.id !== focusedComuneId),
    ...subareas
  ];
}

export function findComuneForCity(
  areas: readonly NeighborhoodArea[],
  cityName: string
): NeighborhoodArea | null {
  return (
    areas.find(
      (area) =>
        area.areaLevel === "comune" && area.name.toLocaleLowerCase("it-IT") === cityName.toLocaleLowerCase("it-IT")
    ) ?? null
  );
}

export function countCoverage(areas: readonly NeighborhoodArea[]): {
  readonly comuni: number;
  readonly subcomuni: number;
  readonly bigCitiesWithSubareas: number;
} {
  const comuneIds = new Set<string>();
  const parentComuneIds = new Set<string>();
  let subcomuni = 0;

  for (const area of areas) {
    if (area.areaLevel === "comune") {
      comuneIds.add(area.id);
    }

    if (area.areaLevel === "subcomune") {
      subcomuni += 1;

      if (area.parentComuneId) {
        parentComuneIds.add(area.parentComuneId);
      }
    }
  }

  return {
    comuni: comuneIds.size,
    subcomuni,
    bigCitiesWithSubareas: parentComuneIds.size
  };
}
