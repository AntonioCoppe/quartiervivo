import {
  Box,
  HelpCircle,
  Languages,
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AboutModal } from "./components/AboutModal";
import { AddressSearch } from "./components/AddressSearch";
import { DetailsPanel } from "./components/DetailsPanel";
import { Legend } from "./components/Legend";
import { MapPanel } from "./components/MapPanel";
import { Sidebar } from "./components/Sidebar";
import { cityShortcuts } from "./data/cities";
import { metricGroups as fallbackMetricGroups, metrics as fallbackMetrics } from "./data/metrics";
import { findMetricValue, formatMetricValue, getLocalizedText, getMetricDomain } from "./domain/metrics";
import type {
  AreaDetail,
  CityShortcut,
  FlyToRequest,
  GeocoderResult,
  LocaleCode,
  MetricCatalog,
  MetricDefinition,
  MetricGroup,
  NeighborhoodArea,
  PoiCategory,
  PoiFeature,
  ThemeMode
} from "./types/geography";

const poiCategories: readonly PoiCategory[] = [
  "schools",
  "healthcare",
  "pharmacies",
  "supermarkets",
  "transit",
  "parks"
];

const compactViewportQuery = "(max-width: 940px)";

interface AppData {
  readonly areas: readonly NeighborhoodArea[];
  readonly areaDetails: Record<string, AreaDetail>;
  readonly metricGroups: readonly MetricGroup[];
  readonly metrics: readonly MetricDefinition[];
  readonly pois: readonly PoiFeature[];
}

const uiText = {
  en: {
    mapLabel: "Interactive neighborhood map",
    splash: "Loading Italian socio-demographic map",
    loadingDetail: "Preparing PMTiles, catalog, and official data sources",
    selected: "Selected area",
    language: "Switch language",
    theme: "Toggle dark mode",
    threeD: "Toggle 3D",
    about: "About",
    openSidebar: "Open sidebar",
    geolocationUnavailable: "Geolocation is not available in this browser.",
    geolocationDenied: "Location was not available. You can still search an address.",
    geolocationFound: "Moved to your position; selecting the rendered area if available.",
    searchMoved: "Moved to search result."
  },
  it: {
    mapLabel: "Mappa interattiva dei quartieri",
    splash: "Caricamento mappa socio-demografica italiana",
    loadingDetail: "Preparazione di PMTiles, catalogo e fonti ufficiali",
    selected: "Area selezionata",
    language: "Cambia lingua",
    theme: "Attiva/disattiva tema scuro",
    threeD: "Attiva/disattiva 3D",
    about: "Informazioni",
    openSidebar: "Apri barra laterale",
    geolocationUnavailable: "La geolocalizzazione non e disponibile in questo browser.",
    geolocationDenied: "Posizione non disponibile. Puoi comunque cercare un indirizzo.",
    geolocationFound: "Spostato sulla tua posizione; selezione dell'area se disponibile.",
    searchMoved: "Spostato sul risultato di ricerca."
  }
} as const;

function createDefaultPoiState(): Record<PoiCategory, boolean> {
  return {
    schools: true,
    healthcare: true,
    pharmacies: true,
    supermarkets: true,
    transit: true,
    parks: true
  };
}

function isCompactViewport() {
  return typeof window !== "undefined" && window.matchMedia(compactViewportQuery).matches;
}

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedMetricId, setSelectedMetricId] = useState("income_per_capita");
  const [activeCity, setActiveCity] = useState<CityShortcut>(cityShortcuts[0]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [poiVisibility, setPoiVisibility] = useState(createDefaultPoiState);
  const [locale, setLocale] = useState<LocaleCode>("en");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [is3d, setIs3d] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => isCompactViewport());
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<readonly [number, number, number, number] | null>(null);
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchJson<MetricCatalog>("/data/catalog.json", controller.signal),
      fetchJson<readonly NeighborhoodArea[]>("/data/national-areas.json", controller.signal),
      fetchJson<Record<string, AreaDetail>>("/data/area-details.json", controller.signal),
      fetchJson<readonly PoiFeature[]>("/data/pois.json", controller.signal)
    ])
      .then(([catalog, areas, areaDetails, pois]) => {
        setAppData({
          areas,
          areaDetails,
          metricGroups: catalog.metricGroups,
          metrics: catalog.metrics,
          pois
        });
        setSelectedAreaId(isCompactViewport() ? null : areas.find((area) => area.id === "comune-058091")?.id ?? areas[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDataError(error instanceof Error ? error.message : String(error));
        setAppData({
          areas: [],
          areaDetails: {},
          metricGroups: fallbackMetricGroups,
          metrics: fallbackMetrics,
          pois: []
        });
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const labels = uiText[locale];
  const areas = appData?.areas ?? [];
  const metrics = appData?.metrics ?? fallbackMetrics;
  const metricGroups = appData?.metricGroups ?? fallbackMetricGroups;
  const pois = appData?.pois ?? [];
  const selectedMetric = metrics.find((metric) => metric.id === selectedMetricId) ?? metrics[0];
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? null;
  const selectedDetail = selectedAreaId && appData?.areaDetails ? appData.areaDetails[selectedAreaId] ?? null : null;
  const selectedAreaMetricValue = selectedArea ? findMetricValue(selectedArea, selectedMetric.id) : null;
  const metricDomain = useMemo(
    () => getMetricDomain(areas, selectedMetric.id),
    [areas, selectedMetric.id]
  );
  const loading = !appData || !mapReady;

  const handleTogglePoi = (category: PoiCategory) => {
    setPoiVisibility((current) => ({
      ...current,
      [category]: !current[category]
    }));
  };

  const handleCitySelect = (city: CityShortcut) => {
    setActiveCity(city);
    setSidebarCollapsed(isCompactViewport());
  };

  const handleMetricChange = (metricId: string) => {
    setSelectedMetricId(metricId);
    setSidebarCollapsed(isCompactViewport());
  };

  const handleResultSelect = (result: GeocoderResult) => {
    setSearchStatus(labels.searchMoved);
    setFlyToRequest({
      id: Date.now(),
      center: result.center,
      zoom: result.type === "city" || result.type === "administrative" ? 10.8 : 13.5,
      label: result.label,
      matchName: result.matchName,
      selectAtCenter: true
    });
  };

  const handleFindMyArea = () => {
    if (!navigator.geolocation) {
      setSearchStatus(labels.geolocationUnavailable);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchStatus(labels.geolocationFound);
        setFlyToRequest({
          id: Date.now(),
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 13.5,
          selectAtCenter: true
        });
      },
      () => setSearchStatus(labels.geolocationDenied),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
    );
  };

  return (
    <div
      className={[
        "app-shell",
        sidebarCollapsed ? "sidebar-collapsed" : "",
        theme === "dark" ? "dark" : ""
      ].filter(Boolean).join(" ")}
    >
      <Sidebar
        activeCity={activeCity}
        areas={areas}
        cities={cityShortcuts}
        collapsed={sidebarCollapsed}
        locale={locale}
        metric={selectedMetric}
        metricGroups={metricGroups}
        metrics={metrics}
        poiCategories={poiCategories}
        poiVisibility={poiVisibility}
        selectedArea={selectedArea}
        selectedAreaValue={selectedAreaMetricValue}
        viewportBounds={viewportBounds}
        onCitySelect={handleCitySelect}
        onCollapse={() => setSidebarCollapsed(true)}
        onMetricChange={handleMetricChange}
        onTogglePoi={handleTogglePoi}
      />

      <main className="map-shell" aria-label={labels.mapLabel}>
        {sidebarCollapsed ? (
          <button
            className="sidebar-reopen"
            type="button"
            aria-label={labels.openSidebar}
            onClick={() => setSidebarCollapsed(false)}
          >
            <Menu size={16} aria-hidden="true" />
          </button>
        ) : null}

        <AddressSearch
          locale={locale}
          status={searchStatus}
          onFindMyArea={handleFindMyArea}
          onResultSelect={handleResultSelect}
        />

        <div className="top-controls" aria-label="Map controls">
          <button
            className={is3d ? "control-button active" : "control-button"}
            type="button"
            aria-label={labels.threeD}
            aria-pressed={is3d}
            onClick={() => setIs3d((current) => !current)}
          >
            <Box size={16} />
          </button>
          <button
            className="control-button language"
            type="button"
            aria-label={labels.language}
            onClick={() => setLocale((current) => (current === "en" ? "it" : "en"))}
          >
            <Languages size={14} aria-hidden="true" />
            <span>{locale === "en" ? "IT" : "EN"}</span>
          </button>
          <button
            className={theme === "dark" ? "control-button active" : "control-button"}
            type="button"
            aria-label={labels.theme}
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className="control-button"
            type="button"
            aria-label={labels.about}
            onClick={() => setAboutOpen(true)}
          >
            <HelpCircle size={16} />
          </button>
        </div>

        <MapPanel
          activeCity={activeCity}
          domain={metricDomain}
          flyToRequest={flyToRequest}
          is3d={is3d}
          locale={locale}
          metric={selectedMetric}
          pois={pois}
          poiVisibility={poiVisibility}
          selectedAreaId={selectedAreaId}
          theme={theme}
          onAreaSelect={setSelectedAreaId}
          onMapReady={() => setMapReady(true)}
          onViewportChange={setViewportBounds}
        />

        {selectedArea ? (
          <aside className="selection-card" aria-label={labels.selected}>
            <span>{selectedArea.city}</span>
            <strong>{selectedArea.name}</strong>
            <b>{formatMetricValue(selectedAreaMetricValue, selectedMetric, locale)}</b>
          </aside>
        ) : null}

        {selectedDetail ? (
          <DetailsPanel
            detail={selectedDetail}
            locale={locale}
            metric={selectedMetric}
            metrics={metrics}
            onClose={() => setSelectedAreaId(null)}
          />
        ) : null}

        <Legend domain={metricDomain} locale={locale} metric={selectedMetric} />

        <footer className="map-credit">
          MEF · ISTAT · OpenStreetMap contributors · OpenFreeMap/OpenMapTiles
        </footer>

        {loading ? (
          <div className="splash-screen" role="status" aria-live="polite">
            <img className="splash-logo" src="/logo-full.png" alt="QuartierVivo" />
            <h2 className="sr-only">QuartierVivo</h2>
            <p>{labels.splash}</p>
            <span>{labels.loadingDetail}</span>
          </div>
        ) : null}

        {dataError ? (
          <div className="data-warning" role="status">
            {dataError}
          </div>
        ) : null}
      </main>

      {aboutOpen ? (
        <AboutModal locale={locale} metrics={metrics} onClose={() => setAboutOpen(false)} />
      ) : null}
    </div>
  );
}

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });

  if (!response.ok) {
    throw new Error(`Unable to load ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
