export type Granularity =
  | "cap"
  | "census_section"
  | "official_neighborhood"
  | "istat_area_subcomunale"
  | "municipality";

export type LocaleCode = "en" | "it";

export type ThemeMode = "light" | "dark";

export type MetricGroupId = "population" | "income" | "employment" | "education";

export interface LocalizedText {
  readonly en: string;
  readonly it: string;
}

export type AreaLevel = "comune" | "subcomune";

export type SubcomuneKind =
  | "quartiere"
  | "rione"
  | "municipio"
  | "circoscrizione"
  | "nil"
  | "zona"
  | "area_statistica"
  | "other";

export type PoiCategory =
  | "schools"
  | "healthcare"
  | "pharmacies"
  | "supermarkets"
  | "transit"
  | "parks";

export interface DataSource {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly url: string;
  readonly license: string;
  readonly refreshCadence: string;
  readonly notes: string;
}

export interface MetricDefinition {
  readonly id: string;
  readonly group?: MetricGroupId;
  readonly label: LocalizedText;
  readonly shortLabel: LocalizedText;
  readonly unit: "EUR" | "count" | "percent" | "index";
  readonly year: number;
  readonly sourceId: string;
  readonly granularity: Granularity;
  readonly tileProperty?: string;
  readonly colorStops?: readonly number[];
  readonly description: LocalizedText;
}

export interface MetricGroup {
  readonly id: MetricGroupId;
  readonly label: LocalizedText;
}

export interface MetricCatalog {
  readonly metricGroups: readonly MetricGroup[];
  readonly metrics: readonly MetricDefinition[];
}

export interface MetricValue {
  readonly metricId: string;
  readonly value: number | null;
  readonly year: number;
}

export interface NeighborhoodArea {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly region: string;
  readonly areaLevel: AreaLevel;
  readonly granularity: Granularity;
  readonly istatCode?: string;
  readonly cadastralCode?: string;
  readonly province?: string;
  readonly provinceCode?: string;
  readonly parentComuneId?: string;
  readonly subcomuneKind?: SubcomuneKind;
  readonly population?: number | null;
  readonly sourceIds?: readonly string[];
  readonly metrics: readonly MetricValue[];
}

export interface CoverageSource {
  readonly id: string;
  readonly url: string;
  readonly role: "income" | "population" | "boundaries" | "identifiers" | "subcomune-boundaries";
  readonly expectedFile?: string;
  readonly notes: string;
}

export interface CoverageManifest {
  readonly generatedAt: string;
  readonly nationalAreaLevel: "comune";
  readonly comuneCount: number;
  readonly subcomuneCityCount: number;
  readonly sources: readonly CoverageSource[];
}

export interface CityShortcut {
  readonly id: string;
  readonly name: string;
  readonly center: readonly [number, number];
  readonly zoom: number;
  readonly pitch: number;
  readonly bearing: number;
}

export interface PoiFeature {
  readonly id: string;
  readonly name: string;
  readonly category: PoiCategory;
  readonly coordinates: readonly [number, number];
  readonly address?: string;
  readonly osmUrl?: string;
  readonly tags?: Record<string, string>;
}

export interface RankedArea {
  readonly area: NeighborhoodArea;
  readonly value: number;
  readonly rank: number;
}

export interface MetricSeries {
  readonly years: readonly number[];
  readonly values: readonly (number | null)[];
  readonly nationalValues?: readonly (number | null)[];
}

export interface AreaDetail {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly region: string;
  readonly istatCode?: string;
  readonly province?: string;
  readonly areaLevel: AreaLevel;
  readonly granularity: Granularity;
  readonly sourceIds?: readonly string[];
  readonly metrics: Record<string, number | null>;
  readonly metricSeries?: Record<string, MetricSeries>;
  readonly ageStructure: {
    readonly under15: number | null;
    readonly age15To64: number | null;
    readonly age65Plus: number | null;
  };
  readonly originBreakdown: {
    readonly europe: number | null;
    readonly africa: number | null;
    readonly americas: number | null;
    readonly asia: number | null;
  };
  readonly sectorBreakdown: {
    readonly agriculture: number | null;
    readonly industry: number | null;
    readonly construction: number | null;
    readonly services: number | null;
  };
}

export interface GeocoderResult {
  readonly id: string;
  readonly label: string;
  readonly center: readonly [number, number];
  readonly type: string;
  readonly matchName?: string;
}

export interface FlyToRequest {
  readonly id: number;
  readonly center: readonly [number, number];
  readonly zoom: number;
  readonly label?: string;
  readonly matchName?: string;
  readonly selectAtCenter?: boolean;
}
