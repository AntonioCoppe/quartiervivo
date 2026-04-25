import maplibregl, {
  type LngLatLike,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type Popup
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createExtrusionHeightExpression,
  createIncomeColorExpression
} from "../map/layers";
import type {
  CityShortcut,
  FlyToRequest,
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
  const [mapError, setMapError] = useState<string | null>(null);

  const visiblePois = useMemo(
    () => pois.filter((poi) => poiVisibility[poi.category]),
    [pois, poiVisibility]
  );
  const metricProperty = metric.tileProperty ?? metric.id;

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
        url: areaPmtilesUrl
      });
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        "source-layer": areaSourceLayer,
        paint: {
          "fill-color": createIncomeColorExpression(domain, metricProperty, theme),
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
          "fill-extrusion-color": createIncomeColorExpression(domain, metricProperty, theme),
          "fill-extrusion-height": createExtrusionHeightExpression(domain, metricProperty, is3d),
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
      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = "";
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
      map.setPaintProperty("areas-fill", "fill-color", createIncomeColorExpression(domain, metricProperty, theme));
      map.setPaintProperty("areas-fill", "fill-opacity", theme === "dark" ? 0.62 : 0.72);
    }

    if (map.getLayer("areas-extrusion")) {
      map.setPaintProperty("areas-extrusion", "fill-extrusion-color", createIncomeColorExpression(domain, metricProperty, theme));
      map.setPaintProperty(
        "areas-extrusion",
        "fill-extrusion-height",
        createExtrusionHeightExpression(domain, metricProperty, is3d)
      );
      map.setPaintProperty("areas-extrusion", "fill-extrusion-opacity", is3d ? 0.78 : 0);
    }

    if (map.getLayer("areas-outline")) {
      map.setPaintProperty("areas-outline", "line-color", theme === "dark" ? "#22272b" : "#ffffff");
    }
  }, [domain, is3d, metricProperty, theme]);

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
      const point = map.project(flyToRequest.center as LngLatLike);
      const features = map.queryRenderedFeatures(point, { layers: ["areas-fill", "areas-extrusion"] });
      selectArea(features[0], onAreaSelect);
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
    </section>
  );
}

function selectArea(feature: MapGeoJSONFeature | undefined, onAreaSelect: (areaId: string) => void) {
  const areaId = feature?.properties?.id;

  if (typeof areaId === "string") {
    onAreaSelect(areaId);
  }
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
