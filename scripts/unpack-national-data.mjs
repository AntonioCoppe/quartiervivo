import { mkdir, readdir } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { spawn } from "node:child_process";

const rawDir = new URL("../data/raw/", import.meta.url);
const extractedDir = new URL("../data/raw/extracted/", import.meta.url);

async function main() {
  await mkdir(extractedDir, { recursive: true });
  const files = await readdir(rawDir).catch(() => []);
  const zipFiles = files.filter((file) => extname(file).toLowerCase() === ".zip");

  if (zipFiles.length === 0) {
    console.log("No ZIP files found in data/raw.");
    return;
  }

  for (const file of zipFiles) {
    const source = join(rawDir.pathname, file);
    const target = join(extractedDir.pathname, parse(file).name);
    await mkdir(target, { recursive: true });
    await unzip(source, target);
    console.log(`Extracted ${file} -> ${target}`);
  }
}

function unzip(source, target) {
  return new Promise((resolve, reject) => {
    const child = spawn("unzip", ["-o", source, "-d", target], {
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`unzip exited with code ${code}`));
    });
  });
}

await main();
