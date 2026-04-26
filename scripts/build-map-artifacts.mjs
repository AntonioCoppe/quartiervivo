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
const ascLevels = [3, 2, 1];
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
  const subcomuneGeoJsonPaths = await createSubcomuneGeoJsonFiles();

  const [boundaryGeoJson, subcomuneGeoJsonByLevel, areas, catalog, coverage] = await Promise.all([
    readJson(boundaryGeoJsonPath),
    Promise.all(
      subcomuneGeoJsonPaths.map(async ({ level, path }) => ({
        level,
        geojson: await readJson(path)
      }))
    ),
    readJson(join(publicDataDir, "national-areas.json")),
    readJson(join(publicDataDir, "catalog.json")),
    readJson(join(publicDataDir, "coverage.json"))
  ]);
  const areasByIstat = new Map(
    areas
      .filter((area) => area.areaLevel === "comune")
      .map((area) => [area.istatCode, area])
  );
  const subcomuneAreasByKey = new Map(
    areas
      .filter((area) => area.areaLevel === "subcomune")
      .map((area) => [`${area.subcomuneLevel}:${area.subcomuneCode}`, area])
  );
  const splitComuneIds = new Set(
    areas
      .filter((area) => area.areaLevel === "subcomune" && area.parentComuneId)
      .map((area) => area.parentComuneId)
  );
  const metrics = catalog.metrics;

  const comuneFeatures = boundaryGeoJson.features
    .map((feature) => {
      const istatCode = String(feature.properties?.PRO_COM_T ?? "").padStart(6, "0");
      const area = areasByIstat.get(istatCode);

      if (!area) {
        return null;
      }

      if (splitComuneIds.has(area.id)) {
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
  const subcomuneFeatures = subcomuneGeoJsonByLevel.flatMap(({ level, geojson }) =>
    geojson.features
      .map((feature) => createSubcomuneFeature(feature, level, subcomuneAreasByKey, metrics))
      .filter(Boolean)
  );
  const features = [...comuneFeatures, ...subcomuneFeatures];

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
    "NAME=QuartierVivo areas",
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
    subcomuneGeometryCount: subcomuneFeatures.length,
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

async function createSubcomuneGeoJsonFiles() {
  const outputs = [];

  for (const level of ascLevels) {
    const sourcePath = join(rootDir.pathname, `data/raw/extracted/ASC_21/ASC_21/ASC_Liv_${level}_2021.shp`);
    const outputPath = join(processedDir, `asc-liv-${level}-2021.geojson`);
    await rm(outputPath, { force: true });
    await execFileAsync("ogr2ogr", [
      "-f",
      "GeoJSON",
      "-t_srs",
      "EPSG:4326",
      "-lco",
      "RFC7946=YES",
      outputPath,
      sourcePath
    ]);
    outputs.push({ level, path: outputPath });
  }

  return outputs;
}

function createSubcomuneFeature(feature, level, subcomuneAreasByKey, metrics) {
  const subcomuneCode = String(feature.properties?.[`COM_ASC${level}`] ?? "");
  const area = subcomuneAreasByKey.get(`${level}:${subcomuneCode}`);

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
      istatCode: area.istatCode,
      parentComuneId: area.parentComuneId,
      subcomuneCode,
      subcomuneLevel: level,
      subcomuneKind: area.subcomuneKind ?? "",
      ...metricValues
    },
    geometry: feature.geometry
  };
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
