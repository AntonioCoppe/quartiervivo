import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const rootDir = new URL("../", import.meta.url);
const boundaryPath = join(
  rootDir.pathname,
  "data/raw/extracted/Limiti01012026_g/Com01012026_g/Com01012026_g_WGS84.shp"
);
const processedDir = join(rootDir.pathname, "data/processed");
const publicDataDir = join(rootDir.pathname, "public/data");
const boundaryGeoJsonPath = join(processedDir, "comuni-boundaries.geojson");
const areaGeoJsonPath = join(publicDataDir, "areas.geojson");
const areaPmtilesPath = join(publicDataDir, "areas.pmtiles");

async function main() {
  await mkdir(processedDir, { recursive: true });
  await mkdir(publicDataDir, { recursive: true });
  await ensureGdalPmtilesSupport();

  await execFileAsync("ogr2ogr", [
    "-f",
    "GeoJSON",
    "-t_srs",
    "EPSG:4326",
    "-lco",
    "RFC7946=YES",
    boundaryGeoJsonPath,
    boundaryPath
  ]);

  const [boundaryGeoJson, areas, catalog, coverage] = await Promise.all([
    readJson(boundaryGeoJsonPath),
    readJson(join(publicDataDir, "national-areas.json")),
    readJson(join(publicDataDir, "catalog.json")),
    readJson(join(publicDataDir, "coverage.json"))
  ]);
  const areasByIstat = new Map(areas.map((area) => [area.istatCode, area]));
  const metrics = catalog.metrics;

  const features = boundaryGeoJson.features
    .map((feature) => {
      const istatCode = String(feature.properties?.PRO_COM_T ?? "").padStart(6, "0");
      const area = areasByIstat.get(istatCode);

      if (!area) {
        return null;
      }

      const metricValues = Object.fromEntries(
        metrics.map((metric) => [
          metric.tileProperty,
          area.metrics.find((value) => value.metricId === metric.id)?.value ?? null
        ])
      );

      return {
        type: "Feature",
        id: area.id,
        properties: {
          id: area.id,
          name: area.name,
          city: area.city,
          region: area.region,
          province: area.province ?? "",
          areaLevel: area.areaLevel,
          granularity: area.granularity,
          istatCode,
          ...metricValues
        },
        geometry: feature.geometry
      };
    })
    .filter(Boolean);

  const areaGeoJson = {
    type: "FeatureCollection",
    name: "areas",
    features
  };

  await writeFile(areaGeoJsonPath, `${JSON.stringify(areaGeoJson)}\n`);
  await rm(areaPmtilesPath, { force: true });
  await execFileAsync("ogr2ogr", [
    "-f",
    "PMTiles",
    areaPmtilesPath,
    areaGeoJsonPath,
    "-nln",
    "areas",
    "-dsco",
    "NAME=MappaQuartieri areas",
    "-dsco",
    "DESCRIPTION=Italian comune choropleth areas",
    "-dsco",
    "MINZOOM=0",
    "-dsco",
    "MAXZOOM=10",
    "-dsco",
    "SIMPLIFICATION=2.5",
    "-dsco",
    "SIMPLIFICATION_MAX_ZOOM=0.4"
  ]);

  const updatedCoverage = {
    ...coverage,
    areaGeometryCount: features.length,
    pmtiles: {
      sourceLayer: "areas",
      path: "/data/areas.pmtiles",
      minzoom: 0,
      maxzoom: 10
    },
    metricCount: metrics.length,
    sourceBackedMetricCount: metrics.filter((metric) =>
      features.some((feature) => feature.properties[metric.tileProperty] !== null)
    ).length,
    poiCategories: ["schools", "healthcare", "pharmacies", "supermarkets", "transit", "parks"]
  };
  await writeFile(join(publicDataDir, "coverage.json"), `${JSON.stringify(updatedCoverage, null, 2)}\n`);

  console.log({
    geojson: areaGeoJsonPath,
    pmtiles: areaPmtilesPath,
    features: features.length
  });
}

async function ensureGdalPmtilesSupport() {
  try {
    const { stdout } = await execFileAsync("ogr2ogr", ["--formats"]);

    if (!stdout.includes("PMTiles")) {
      throw new Error("GDAL is installed, but the PMTiles vector driver is unavailable.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GDAL ogr2ogr with PMTiles support is required to build map artifacts: ${message}`);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

await main();
