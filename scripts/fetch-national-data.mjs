import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const manifestPath = new URL("../data/source-manifest.json", import.meta.url);
const rawDir = new URL("../data/raw/", import.meta.url);

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await mkdir(rawDir, { recursive: true });

  const results = [];

  for (const source of manifest.sources) {
    const filename = source.expectedFile ?? basename(new URL(source.url).pathname);
    const target = join(rawDir.pathname, filename);

    try {
      const response = await fetch(source.url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(target, bytes);
      results.push({ id: source.id, status: "downloaded", target, bytes: bytes.length });
    } catch (error) {
      const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : null;
      results.push({
        id: source.id,
        status: source.optional ? "optional_failed" : "failed",
        target,
        error: [error instanceof Error ? error.message : String(error), cause].filter(Boolean).join(": ")
      });
    }
  }

  console.table(results);

  if (results.some((result) => result.status === "failed")) {
    process.exitCode = 1;
  }
}

await main();
