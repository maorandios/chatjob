/**
 * Fail the build if client chunks contain syntax that breaks Safari 15 and below.
 * Class static blocks cannot be polyfilled — they must be transpiled away.
 */
const fs = require("fs");
const path = require("path");

const chunksDir = path.join(process.cwd(), ".next", "static", "chunks");

if (!fs.existsSync(chunksDir)) {
  console.error("[verify-legacy-bundle] Missing .next/static/chunks — run next build first.");
  process.exit(1);
}

const files = fs.readdirSync(chunksDir).filter((name) => name.endsWith(".js"));
const failures = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(chunksDir, file), "utf8");
  if (/static\s*\{/.test(source)) {
    failures.push(`${file}: contains class static blocks (Safari < 16.4)`);
  }
}

if (failures.length > 0) {
  console.error("[verify-legacy-bundle] Legacy browser compatibility check FAILED:\n");
  for (const line of failures) console.error(`  - ${line}`);
  console.error(
    "\nEnsure package.json browserslist.production targets ios_saf >= 12 and rebuild with a clean .next folder."
  );
  process.exit(1);
}

console.log(`[verify-legacy-bundle] OK — ${files.length} client chunks, no static blocks.`);
