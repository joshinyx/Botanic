import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function patchDir(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (entry === ".vc-config.json") {
      const raw = readFileSync(full, "utf8");
      const config = JSON.parse(raw);
      if (config.runtime === "nodejs18.x") {
        config.runtime = "nodejs20.x";
        writeFileSync(full, JSON.stringify(config, null, "\t"));
        console.log(`Patched runtime: ${full}`);
      }
    } else if (statSync(full).isDirectory()) {
      patchDir(full);
    }
  }
}

patchDir(".vercel/output/functions");
