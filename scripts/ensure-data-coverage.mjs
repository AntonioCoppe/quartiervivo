import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { auditComuneDataCoverage } from "./lib/data-coverage.mjs";

const rootDir = new URL("../", import.meta.url).pathname;
const publicDataDir = join(rootDir, "public/data");

async function main() {
  const initialAudit = await auditGeneratedArtifacts().catch((error) => ({
    ok: false,
    failures: [`Unable to read generated artifacts: ${error instanceof Error ? error.message : String(error)}`],
    summary: null
  }));

  if (initialAudit.ok) {
    console.log("Comune data coverage is complete.");
    console.log(initialAudit.summary);
    return;
  }

  console.warn("Comune data coverage is incomplete. Fetching and rebuilding official data artifacts.");
  console.warn(initialAudit.failures.join("\n"));
  await run("npm", ["run", "data:fetch"]);
  await run("npm", ["run", "data:unpack"]);
  await run("npm", ["run", "data:all"]);

  const finalAudit = await auditGeneratedArtifacts();

  if (!finalAudit.ok) {
    console.error("Comune data coverage is still incomplete after fetch/rebuild.");
    console.error(finalAudit.failures.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Comune data coverage is complete after rebuild.");
  console.log(finalAudit.summary);
}

async function auditGeneratedArtifacts() {
  const [areas, areaDetails, coverage] = await Promise.all([
    readJson(join(publicDataDir, "national-areas.json")),
    readJson(join(publicDataDir, "area-details.json")),
    readJson(join(publicDataDir, "coverage.json"))
  ]);

  return auditComuneDataCoverage({ areas, areaDetails, coverage });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

await main();
