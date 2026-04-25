import maplibregl, {
  type LngLatLike,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type Popup
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  createExtrusionHeightExpression,
  createIncomeColorExpression
} from "../map/layers";
import { formatMetricValue, getLocalizedText, getMetricColorStops } from "../domain/metrics";
import type {
  CityShortcut,
  FlyToRequest,
  LocaleCode,
  MetricDefinition,
  PoiCategory,
  PoiFeature,
  ThemeMode
} from "../types/geography";

interface MapPanelProps {
  readonly activeCity: CityShortcut;
  readonly domain: readonly [number, number];
  readonly flyToRequest: FlyToRequest | null;
  readonly is3d: boolean;
  readonly locale: LocaleCode;
  readonly metric: MetricDefinition;
  readonly pois: readonly PoiFeature[];
  readonly poiVisibility: Record<PoiCategory, boolean>;
  readonly selectedAreaId: string | null;
  readonly theme: ThemeMode;
  readonly onAreaSelect: (areaId: string) => void;
  readonly onMapReady: () => void;
  readonly onViewportChange: (bounds: readonly [number, number, number, number]) => void;
}

const baseMapStyle =
  import.meta.env.VITE_BASEMAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";
const areaPmtilesUrl = "pmtiles:///data/areas.pmtiles";
const areaSourceLayer = "areas";

const poiColors: Record<PoiCategory, string> = {
  schools: "#3366e8",
  healthcare: "#d4483f",
  pharmacies: "#4caf50",
  supermarkets: "#e2a23a",
  transit: "#7d55dc",
  parks: "#5aa86c"
};

let pmtilesProtocolRegistered = false;

function ensurePmtilesProtocol() {
  if (pmtilesProtocolRegistered) {
    return;
  }

  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesProtocolRegistered = true;
}

function createPoiGeoJson(pois: readonly PoiFeature[]) {
  return {
    type: "FeatureCollection" as const,
    features: pois.map((poi) => ({
      type: "Feature" as const,
      id: poi.id,
      properties: {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        address: poi.address ?? "",
        osmUrl: poi.osmUrl ?? "https://www.openstreetmap.org"
      },
      geometry: {
        type: "Point" as const,
        coordinates: [...poi.coordinates]
      }
    }))
  };
}

export function MapPanel({
  activeCity,
  domain,
  flyToRequest,
  is3d,
  locale,
  metric,
  pois,
  poiVisibility,
  selectedAreaId,
  theme,
  onAreaSelect,
  onMapReady,
  onViewportChange
}: MapPanelProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const hoverFeatureIdRef = useRef<string | number | null>(null);
  const metricRef = useRef(metric);
  const metricPropertyRef = useRef(metric.tileProperty ?? metric.id);
  const localeRef = useRef(locale);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{
    readonly x: number;
    readonly y: number;
    readonly name: string;
    readonly value: string;
    readonly label: string;
  } | null>(null);

  const visiblePois = useMemo(
    () => pois.filter((poi) => poiVisibility[poi.category]),
    [pois, poiVisibility]
  );
  const metricProperty = metric.tileProperty ?? metric.id;
  const metricStops = useMemo(() => getMetricColorStops(metric, domain), [domain, metric]);

  useEffect(() => {
    metricRef.current = metric;
    metricPropertyRef.current = metricProperty;
    localeRef.current = locale;
  }, [locale, metric, metricProperty]);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) {
      return;
    }

    ensurePmtilesProtocol();

    const map = new maplibregl.Map({
      container: mapNode.current,
      style: baseMapStyle,
      center: [12.5674, 42.5],
      zoom: 5.1,
      pitch: is3d ? 48 : 0,
      bearing: -8,
      attributionControl: false,
      cooperativeGestures: true
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const syncBounds = () => {
      const bounds = map.getBounds();
      onViewportChange([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]);
    };

    map.on("moveend", syncBounds);
    map.on("error", (event) => {
      const message = event.error?.message ?? "";

      if (message.includes("areas.pmtiles")) {
        setMapError("PMTiles area source unavailable. Run npm run data:map.");
      }
    });

    map.on("load", () => {
      map.addSource("areas", {
        type: "vector",
        url: areaPmtilesUrl,
        promoteId: "id"
      });
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        "source-layer": areaSourceLayer,
        paint: {
          "fill-color": createIncomeColorExpression(domain, metricProperty, theme, metricStops),
          "fill-opacity": theme === "dark" ? 0.62 : 0.72
        }
      });
      map.addLayer({
        id: "areas-extrusion",
        type: "fill-extrusion",
        source: "areas",
        "source-layer": areaSourceLayer,
        minzoom: 7,
        paint: {
          "fill-extrusion-color": createIncomeColorExpression(domain, metricProperty, theme, metricStops),
          "fill-extrusion-height": createExtrusionHeightExpression(domain, metricProperty, is3d, metricStops),
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": is3d ? 0.78 : 0
        }
      });
      map.addLayer({
        id: "areas-outline",
        type: "line",
        source: "areas",
        "source-layer": areaSourceLayer,
        paint: {
          "line-color": theme === "dark" ? "#22272b" : "#ffffff",
          "line-opacity": 0.65,
          "line-width": 0.45
        }
      });

      map.addSource("pois", {
        type: "geojson",
        data: createPoiGeoJson(visiblePois)
      });
      map.addLayer({
        id: "poi-circles",
        type: "circle",
        source: "pois",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 12, 6],
          "circle-stroke-color": theme === "dark" ? "#111418" : "#ffffff",
          "circle-stroke-width": 1.4,
          "circle-color": [
            "match",
            ["get", "category"],
            "schools",
            poiColors.schools,
            "healthcare",
            poiColors.healthcare,
            "pharmacies",
            poiColors.pharmacies,
            "supermarkets",
            poiColors.supermarkets,
            "transit",
            poiColors.transit,
            "parks",
            poiColors.parks,
            "#2f2f2f"
          ]
        }
      });

      map.on("click", "areas-fill", (event) => selectArea(event.features?.[0], onAreaSelect));
      map.on("click", "areas-extrusion", (event) => selectArea(event.features?.[0], onAreaSelect));
      map.on("click", "poi-circles", (event) => {
        const feature = event.features?.[0];
        const coordinates = feature?.geometry.type === "Point" ? feature.geometry.coordinates : null;

        if (!feature || !coordinates) {
          return;
        }

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(coordinates as [number, number])
          .setHTML(createPoiPopupHtml(feature))
          .addTo(map);
      });

      map.on("mouseenter", "areas-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mousemove", "areas-fill", (event) => {
        const feature = event.features?.[0];

        if (!feature) {
          setHoverTooltip(null);
          return;
        }

        updateHoverFeature(map, hoverFeatureIdRef, feature);
        setHoverTooltip(createHoverTooltip(feature, event.point.x, event.point.y, metricRef.current, metricPropertyRef.current, localeRef.current));
      });
      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = "";
        clearHoverFeature(map, hoverFeatureIdRef);
        setHoverTooltip(null);
      });
      map.on("mouseenter", "poi-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "poi-circles", () => {
        map.getCanvas().style.cursor = "";
      });

      syncBounds();
      onMapReady();
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.flyTo({
      center: activeCity.center as LngLatLike,
      zoom: activeCity.zoom,
      pitch: is3d ? activeCity.pitch : 0,
      bearing: activeCity.bearing,
      speed: 0.8,
      essential: true
    });
  }, [activeCity, is3d]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    if (map.getLayer("areas-fill")) {
      map.setPaintProperty("areas-fill", "fill-color", createIncomeColorExpression(domain, metricProperty, theme, metricStops));
      map.setPaintProperty("areas-fill", "fill-opacity", theme === "dark" ? 0.62 : 0.72);
    }

    if (map.getLayer("areas-extrusion")) {
      map.setPaintProperty("areas-extrusion", "fill-extrusion-color", createIncomeColorExpression(domain, metricProperty, theme, metricStops));
      map.setPaintProperty(
        "areas-extrusion",
        "fill-extrusion-height",
        createExtrusionHeightExpression(domain, metricProperty, is3d, metricStops)
      );
      map.setPaintProperty("areas-extrusion", "fill-extrusion-opacity", is3d ? 0.78 : 0);
    }

    if (map.getLayer("areas-outline")) {
      map.setPaintProperty("areas-outline", "line-color", theme === "dark" ? "#22272b" : "#ffffff");
    }
  }, [domain, is3d, metricProperty, metricStops, theme]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("pois") as maplibregl.GeoJSONSource | undefined;
    source?.setData(createPoiGeoJson(visiblePois));
  }, [visiblePois]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded() || !map.getLayer("areas-outline")) {
      return;
    }

    map.setPaintProperty("areas-outline", "line-color", [
      "case",
      ["==", ["get", "id"], selectedAreaId ?? ""],
      theme === "dark" ? "#f4f5f3" : "#14181c",
      theme === "dark" ? "#22272b" : "#ffffff"
    ]);
    map.setPaintProperty("areas-outline", "line-width", [
      "case",
      ["==", ["get", "id"], selectedAreaId ?? ""],
      2,
      0.45
    ]);
  }, [selectedAreaId, theme]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !flyToRequest) {
      return;
    }

    map.flyTo({
      center: flyToRequest.center as LngLatLike,
      zoom: flyToRequest.zoom,
      pitch: is3d ? 54 : 0,
      bearing: is3d ? -12 : 0,
      speed: 0.9,
      essential: true
    });

    if (!flyToRequest.selectAtCenter) {
      return;
    }

    map.once("moveend", () => {
      selectAreaAtSearchPoint(map, flyToRequest, onAreaSelect);
    });
  }, [flyToRequest, is3d, onAreaSelect]);

  return (
    <section className="map-panel" aria-label="Map">
      <div ref={mapNode} className="map-node" />
      {mapError ? (
        <div className="map-error" role="status">
          <strong>{mapError}</strong>
          <span>Check generated files under public/data.</span>
        </div>
      ) : null}
      {hoverTooltip ? (
        <div
          className="area-hover-tooltip"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y }}
          role="status"
        >
          <strong>{hoverTooltip.name}</strong>
          <b>{hoverTooltip.value}</b>
          <span>{hoverTooltip.label}</span>
        </div>
      ) : null}
    </section>
  );
}

function selectArea(feature: MapGeoJSONFeature | undefined, onAreaSelect: (areaId: string) => void) {
  const areaId = feature?.properties?.id;

  if (typeof areaId === "string") {
    onAreaSelect(areaId);
  }
}

function selectAreaAtSearchPoint(
  map: MapLibreMap,
  flyToRequest: FlyToRequest,
  onAreaSelect: (areaId: string) => void
) {
  const point = map.project(flyToRequest.center as LngLatLike);
  const box: [[number, number], [number, number]] = [
    [point.x - 7, point.y - 7],
    [point.x + 7, point.y + 7]
  ];
  const exactFeatures = map.queryRenderedFeatures(point, { layers: ["areas-fill"] });
  const nearbyFeatures = map.queryRenderedFeatures(box, { layers: ["areas-fill"] });
  const features = dedupeFeatures([...exactFeatures, ...nearbyFeatures]);
  const matchName = normalizeSearchName(flyToRequest.matchName ?? flyToRequest.label ?? "");
  const matchedFeature = matchName
    ? features.find((feature) => normalizeSearchName(String(feature.properties?.name ?? "")).includes(matchName))
    : null;

  selectArea(matchedFeature ?? features[0], onAreaSelect);
}

function dedupeFeatures(features: readonly MapGeoJSONFeature[]): readonly MapGeoJSONFeature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    const id = String(feature.properties?.id ?? feature.id ?? "");

    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function createHoverTooltip(
  feature: MapGeoJSONFeature,
  x: number,
  y: number,
  metric: MetricDefinition,
  metricProperty: string,
  locale: LocaleCode
) {
  const value = typeof feature.properties?.[metricProperty] === "number"
    ? feature.properties[metricProperty]
    : Number(feature.properties?.[metricProperty]);

  return {
    x,
    y,
    name: String(feature.properties?.name ?? ""),
    value: formatMetricValue(Number.isFinite(value) ? value : null, metric, locale),
    label: getLocalizedText(metric.shortLabel, locale)
  };
}

function updateHoverFeature(
  map: MapLibreMap,
  hoverFeatureIdRef: MutableRefObject<string | number | null>,
  feature: MapGeoJSONFeature
) {
  const featureId = feature.id ?? feature.properties?.id;

  if (featureId === undefined || featureId === hoverFeatureIdRef.current) {
    return;
  }

  clearHoverFeature(map, hoverFeatureIdRef);
  hoverFeatureIdRef.current = featureId;
  map.setFeatureState({ source: "areas", sourceLayer: areaSourceLayer, id: featureId }, { hover: true });
}

function clearHoverFeature(
  map: MapLibreMap,
  hoverFeatureIdRef: MutableRefObject<string | number | null>
) {
  if (hoverFeatureIdRef.current === null) {
    return;
  }

  map.setFeatureState({ source: "areas", sourceLayer: areaSourceLayer, id: hoverFeatureIdRef.current }, { hover: false });
  hoverFeatureIdRef.current = null;
}

function normalizeSearchName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function createPoiPopupHtml(feature: MapGeoJSONFeature): string {
  const name = escapeHtml(String(feature.properties?.name ?? "Point of interest"));
  const category = escapeHtml(String(feature.properties?.category ?? ""));
  const address = escapeHtml(String(feature.properties?.address ?? ""));
  const osmUrl = escapeHtml(String(feature.properties?.osmUrl ?? "https://www.openstreetmap.org"));

  return `<div class="poi-popup"><strong>${name}</strong><span>${category}</span><p>${address}</p><a href="${osmUrl}" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const replacements: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&#39;",
      "\"": "&quot;"
    };

    return replacements[character] ?? character;
  });
}
