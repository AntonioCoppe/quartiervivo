import {
  Building2,
  ChevronDown,
  ChevronLeft,
  Hospital,
  MapPin,
  Pill,
  School,
  Search,
  ShoppingBasket,
  Train,
  Trees
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatMetricValue, getLocalizedText, rankAreas } from "../domain/metrics";
import type {
  CityShortcut,
  LocaleCode,
  MetricDefinition,
  MetricGroup,
  NeighborhoodArea,
  PoiCategory
} from "../types/geography";

interface SidebarProps {
  readonly activeCity: CityShortcut;
  readonly areas: readonly NeighborhoodArea[];
  readonly cities: readonly CityShortcut[];
  readonly collapsed: boolean;
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly metricGroups: readonly MetricGroup[];
  readonly metrics: readonly MetricDefinition[];
  readonly poiCategories: readonly PoiCategory[];
  readonly poiVisibility: Record<PoiCategory, boolean>;
  readonly selectedArea: NeighborhoodArea | null;
  readonly selectedAreaValue: number | null;
  readonly viewportBounds: readonly [number, number, number, number] | null;
  readonly onCitySelect: (city: CityShortcut) => void;
  readonly onCollapse: () => void;
  readonly onMetricChange: (metricId: string) => void;
  readonly onMiniMapSelect: (center: readonly [number, number]) => void;
  readonly onTogglePoi: (category: PoiCategory) => void;
}

const poiLabels: Record<LocaleCode, Record<PoiCategory, string>> = {
  en: {
    schools: "Schools",
    healthcare: "Hospitals & clinics",
    pharmacies: "Pharmacies",
    supermarkets: "Supermarkets",
    transit: "Train & metro",
    parks: "Parks"
  },
  it: {
    schools: "Scuole",
    healthcare: "Ospedali e cliniche",
    pharmacies: "Farmacie",
    supermarkets: "Supermercati",
    transit: "Treno e metro",
    parks: "Parchi"
  }
};

const sectionLabels = {
  en: {
    tagline: "Explore Italian socio-demographic data at the comune and neighborhood level",
    metric: "Select variable to visualize:",
    view: "View",
    jump: "Jump to",
    pois: "Points of interest",
    selected: "Selected",
    featured: "Featured",
    footer: "Data: MEF, ISTAT, municipal sources, OpenStreetMap"
  },
  it: {
    tagline: "Esplora dati socio-demografici italiani a livello comunale e di quartiere",
    metric: "Seleziona variabile da visualizzare:",
    view: "Vista",
    jump: "Vai a",
    pois: "Punti di interesse",
    selected: "Selezionato",
    featured: "In evidenza",
    footer: "Dati: MEF, ISTAT, fonti comunali, OpenStreetMap"
  }
} as const;

const poiIcons: Record<PoiCategory, typeof School> = {
  schools: School,
  healthcare: Hospital,
  pharmacies: Pill,
  supermarkets: ShoppingBasket,
  transit: Train,
  parks: Trees
};

export function Sidebar({
  activeCity,
  areas,
  cities,
  collapsed,
  locale,
  metric,
  metricGroups,
  metrics,
  poiCategories,
  poiVisibility,
  selectedArea,
  selectedAreaValue,
  viewportBounds,
  onCitySelect,
  onCollapse,
  onMetricChange,
  onMiniMapSelect,
  onTogglePoi
}: SidebarProps) {
  const labels = sectionLabels[locale];
  const topAreas = rankAreas(areas, metric.id, "desc", 3);
  const bottomAreas = rankAreas(areas, metric.id, "asc", 3);

  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"} aria-hidden={collapsed}>
      <section className="brand-block" aria-label="Product">
        <div className="brand-row">
          <h1>MappaQuartieri</h1>
          <button
            className="collapse-button"
            type="button"
            aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
            onClick={onCollapse}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        </div>
        <p>{labels.tagline}</p>
      </section>

      <section className="sidebar-section" aria-labelledby="metric-label">
        <h2 id="metric-label">{labels.metric}</h2>
        <MetricPicker
          locale={locale}
          metric={metric}
          metricGroups={metricGroups}
          metrics={metrics}
          onMetricChange={onMetricChange}
        />
      </section>

      <section className="sidebar-section" aria-labelledby="view-label">
        <h2 id="view-label">{labels.view}</h2>
        <MiniMap activeCity={activeCity} bounds={viewportBounds} onSelect={onMiniMapSelect} />
      </section>

      <section className="sidebar-section" aria-labelledby="jump-label">
        <h2 id="jump-label">{labels.jump}</h2>
        <div className="city-grid">
          {cities.map((city) => (
            <button
              className={city.id === activeCity.id ? "city-button active" : "city-button"}
              key={city.id}
              type="button"
              onClick={() => onCitySelect(city)}
            >
              {city.name}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section" aria-labelledby="poi-label">
        <h2 id="poi-label">{labels.pois}</h2>
        <div className="poi-grid">
          {poiCategories.map((category) => {
            const Icon = poiIcons[category];
            return (
              <button
                className={poiVisibility[category] ? `poi-chip ${category} active` : "poi-chip"}
                key={category}
                type="button"
                onClick={() => onTogglePoi(category)}
                aria-pressed={poiVisibility[category]}
              >
                <Icon size={12} aria-hidden="true" />
                {poiLabels[locale][category]}
              </button>
            );
          })}
        </div>
      </section>

      {selectedArea ? (
        <section className="sidebar-section selected-summary" aria-label="Selected neighborhood">
          <h2>{labels.selected}</h2>
          <div className="selected-row">
            <MapPin size={15} aria-hidden="true" />
            <div>
              <strong>{selectedArea.name}</strong>
              <span>
                {selectedArea.areaLevel === "subcomune"
                  ? `${selectedArea.city} suburb`
                  : `${selectedArea.region} comune`}
              </span>
            </div>
            <b>{formatMetricValue(selectedAreaValue, metric, locale)}</b>
          </div>
        </section>
      ) : null}

      <section className="sidebar-section featured-section" aria-labelledby="featured-label">
        <h2 id="featured-label">{labels.featured}</h2>
        <div className="rank-list">
          {topAreas.map((entry) => (
            <div className="rank-row" key={`top-${entry.area.id}`}>
              <span>TOP {entry.rank}</span>
              <strong>{entry.area.name}</strong>
              <b>{formatMetricValue(entry.value, metric, locale)}</b>
            </div>
          ))}
          {bottomAreas.map((entry) => (
            <div className="rank-row" key={`bottom-${entry.area.id}`}>
              <span>BOT {entry.rank}</span>
              <strong>{entry.area.name}</strong>
              <b>{formatMetricValue(entry.value, metric, locale)}</b>
            </div>
          ))}
        </div>
      </section>

      <footer className="sidebar-footer">
        <Building2 size={13} aria-hidden="true" />
        <span>{labels.footer}</span>
      </footer>
    </aside>
  );
}

interface MetricPickerProps {
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly metricGroups: readonly MetricGroup[];
  readonly metrics: readonly MetricDefinition[];
  readonly onMetricChange: (metricId: string) => void;
}

function MetricPicker({ locale, metric, metricGroups, metrics, onMetricChange }: MetricPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMetrics = useMemo(
    () =>
      metrics.filter((option) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          getLocalizedText(option.label, locale),
          getLocalizedText(option.description, locale),
          option.sourceId,
          option.granularity
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [locale, metrics, normalizedQuery]
  );

  const groupedMetrics = metricGroups
    .map((group) => ({
      group,
      options: filteredMetrics.filter((option) => option.group === group.id)
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className="metric-picker">
      <button
        className={open ? "metric-select open" : "metric-select"}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="metric-icon">$</span>
        <strong>{getLocalizedText(metric.label, locale)}</strong>
        <em>{metric.year}</em>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <div className="metric-menu">
          <label className="metric-search">
            <Search size={13} aria-hidden="true" />
            <input
              autoFocus
              value={query}
              placeholder={locale === "it" ? "Cerca variabili..." : "Search variables..."}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="metric-options" role="listbox" aria-label="Metric">
            {groupedMetrics.map(({ group, options }) => (
              <div className="metric-group" key={group.id}>
                <span>{getLocalizedText(group.label, locale)} ({options[0]?.year})</span>
                {options.map((option) => (
                  <button
                    className={option.id === metric.id ? "metric-option active" : "metric-option"}
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={option.id === metric.id}
                    onClick={() => {
                      onMetricChange(option.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <strong>{getLocalizedText(option.label, locale)}</strong>
                    <em>{option.year}</em>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface MiniMapProps {
  readonly activeCity: CityShortcut;
  readonly bounds: readonly [number, number, number, number] | null;
  readonly onSelect: (center: readonly [number, number]) => void;
}

const miniMapBounds = {
  minLng: 6.1,
  maxLng: 18.8,
  minLat: 35.35,
  maxLat: 47.2
} as const;

const mainlandItaly = [
  [7.05, 45.9],
  [8.0, 46.45],
  [9.1, 46.3],
  [10.35, 46.6],
  [11.6, 46.95],
  [13.55, 46.45],
  [13.1, 45.75],
  [12.3, 45.45],
  [12.9, 44.75],
  [12.55, 43.75],
  [13.25, 43.05],
  [13.9, 42.45],
  [14.75, 42.15],
  [15.2, 41.45],
  [16.05, 40.8],
  [16.55, 40.2],
  [17.25, 40.15],
  [18.35, 40.65],
  [18.45, 39.95],
  [17.55, 39.25],
  [16.75, 38.85],
  [16.2, 38.05],
  [15.75, 37.9],
  [15.8, 38.65],
  [15.25, 39.35],
  [14.45, 40.15],
  [13.85, 40.75],
  [13.15, 41.35],
  [12.65, 42.0],
  [12.2, 42.85],
  [11.65, 43.45],
  [10.9, 44.0],
  [9.9, 44.25],
  [9.15, 44.4],
  [8.35, 44.05],
  [7.7, 44.25],
  [7.45, 44.8],
  [6.9, 45.15],
  [7.05, 45.9]
] as const;

const sardinia = [
  [8.15, 41.25],
  [9.0, 41.2],
  [9.65, 40.75],
  [9.65, 39.55],
  [9.25, 38.9],
  [8.55, 38.85],
  [8.15, 39.25],
  [8.05, 40.2],
  [8.15, 41.25]
] as const;

const sicily = [
  [12.45, 38.05],
  [13.45, 38.15],
  [14.8, 37.9],
  [15.65, 37.35],
  [15.1, 36.75],
  [13.95, 36.65],
  [12.65, 37.25],
  [12.45, 38.05]
] as const;

function MiniMap({ activeCity, bounds, onSelect }: MiniMapProps) {
  const box = bounds ? projectBounds(bounds) : null;
  const activePoint = projectPoint(activeCity.center);

  return (
    <button
      className="mini-map"
      type="button"
      aria-label={`Current view: ${activeCity.name}`}
      onClick={() => onSelect(activeCity.center)}
    >
      <svg viewBox="0 0 180 150" role="img" aria-label={`Current view: ${activeCity.name}`}>
        <path className="mini-italy-shape" d={createPath(mainlandItaly)} />
        <path className="mini-island" d={createPath(sardinia)} />
        <path className="mini-island" d={createPath(sicily)} />
        {box ? (
          <rect
            className="mini-viewport"
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx="1"
          />
        ) : null}
        <circle className="mini-active-dot" cx={activePoint.x} cy={activePoint.y} r="3.4" />
      </svg>
    </button>
  );
}

function projectBounds(bounds: readonly [number, number, number, number]) {
  const [west, south, east, north] = bounds;
  const topLeft = projectPoint([west, north]);
  const bottomRight = projectPoint([east, south]);

  return {
    x: clamp(topLeft.x, 0, 180),
    y: clamp(topLeft.y, 0, 150),
    width: clamp(bottomRight.x - topLeft.x, 8, 180),
    height: clamp(bottomRight.y - topLeft.y, 8, 150)
  };
}

function createPath(points: readonly (readonly [number, number])[]): string {
  return points
    .map((point, index) => {
      const projected = projectPoint(point);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(1)} ${projected.y.toFixed(1)}`;
    })
    .join(" ");
}

function projectPoint(point: readonly [number, number]) {
  const [lng, lat] = point;
  return {
    x: ((lng - miniMapBounds.minLng) / (miniMapBounds.maxLng - miniMapBounds.minLng)) * 180,
    y: ((miniMapBounds.maxLat - lat) / (miniMapBounds.maxLat - miniMapBounds.minLat)) * 150
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
