#!/usr/bin/env node

/**
 * Install a game from an exported ZIP into the repo.
 *
 * Usage: node scripts/install-game.mjs <path-to-zip> [game-id]
 *
 * The ZIP must have been exported from the editor (via the Export button):
 *   <some-name>.json
 *   img/
 *     <image-files>
 *
 * If game-id is omitted, it is derived from the game's `name` field in the JSON
 * (lowercased, spaces/special chars replaced with hyphens).
 *
 * The script will:
 * 1. Extract the ZIP
 * 2. Copy images to public/img/<game-id>/, skipping unchanged files
 * 3. Rewrite image URLs in the JSON to ../img/<game-id>/<filename>
 * 4. Save the JSON to public/games/<game-id>.json
 * 5. Register the game in src/editor/data/gameRegistry.ts (if not already present)
 * 6. Auto-commit with "add game" for new games or "update game" for existing ones
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function info(msg) {
  console.log(`  ${msg}`);
}

/** Convert a display name like "Poker Patience" to a kebab-case id like "poker-patience" */
function nameToId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: node scripts/install-game.mjs <path-to-zip> [game-id]");
    console.error("       If game-id is omitted, it is derived from the JSON game name.");
    process.exit(1);
  }

  const zipPath = args[0];

  if (!existsSync(zipPath)) {
    console.error(`Error: ZIP file not found: ${zipPath}`);
    process.exit(1);
  }

  // Read and extract ZIP
  const zipData = readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipData);

  // Find the JSON file in the ZIP
  const jsonEntry = Object.keys(zip.files).find((name) => name.endsWith(".json"));
  if (!jsonEntry) {
    console.error("Error: No JSON file found in ZIP");
    process.exit(1);
  }

  // Read the JSON
  const jsonContent = await zip.files[jsonEntry].async("string");
  const gameDef = JSON.parse(jsonContent);

  // Derive gameId from name or use provided argument
  const gameId = args[1] || nameToId(gameDef.name || "untitled-game");

  console.log(`\n📦 Installing game "${gameId}" from ${zipPath}...`);
  console.log(`   Game name from JSON: "${gameDef.name}"\n`);

  // Find image entries in ZIP (non-directory entries under img/<gameId>/)
  const imgEntries = Object.entries(zip.files).filter(
    ([name, file]) => !file.dir && name.startsWith("img/"),
  );

  info(`Found ${imgEntries.length} image(s), 1 JSON file.\n`);

  // --- Copy images ---
  const imgDir = join(REPO_ROOT, "public", "img", gameId);
  if (!existsSync(imgDir)) {
    mkdirSync(imgDir, { recursive: true });
    info(`Created directory: public/img/${gameId}/`);
  }

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [entryName, file] of imgEntries) {
    const buffer = await file.async("nodebuffer");
    // Strip the img/<gameId>/ prefix to get just the filename
    const filename = entryName.replace(/^img\/[^/]+\//, "");
    const destPath = join(imgDir, filename);

    if (existsSync(destPath)) {
      const existing = readFileSync(destPath);
      if (existing.equals(buffer)) {
        skippedCount++;
        continue;
      }
      updatedCount++;
    } else {
      addedCount++;
    }

    writeFileSync(destPath, buffer);
  }

  info(`Images: ${addedCount} new, ${updatedCount} modified, ${skippedCount} unchanged.\n`);

  // --- Rewrite image URLs in JSON ---
  // The JSON from the ZIP has relative URLs like `../img/<gameId>/<filename>`.
  // They should already be correct, but verify they point to the right gameId.
  for (const component of gameDef.components) {
    if (component.type === "card") {
      if (component.face?.image) {
        // Ensure the path uses the correct gameId
        const match = component.face.image.match(/\.\.\/img\/([^/]+)\/(.+)/);
        if (match) {
          component.face.image = `../img/${gameId}/${match[2]}`;
        }
      }
      if (component.back?.image) {
        const match = component.back.image.match(/\.\.\/img\/([^/]+)\/(.+)/);
        if (match) {
          component.back.image = `../img/${gameId}/${match[2]}`;
        }
      }
    }
  }

  // --- Save JSON ---
  const jsonDest = join(REPO_ROOT, "public", "games", `${gameId}.json`);
  writeFileSync(jsonDest, JSON.stringify(gameDef, null, 2) + "\n");
  info(`Saved: public/games/${gameId}.json`);

  // --- Register in gameRegistry.ts ---
  const registryPath = join(REPO_ROOT, "src", "editor", "data", "gameRegistry.ts");
  let registryContent = readFileSync(registryPath, "utf-8");

  const idPattern = new RegExp(`id:\\s*"${escapeRegex(gameId)}"`);
  const isNew = !idPattern.test(registryContent);

  if (isNew) {
    const gameName = gameDef.name || gameId;
    const newEntry = `  { id: "${gameId}", filename: "${gameId}.json", label: "${gameName}" },\n];\n`;

    // Replace the closing of the GAMES array followed by the next comment
    registryContent = registryContent.replace(
      /];\n\n\/\*\*\s*\n\s*\* Returns the list of all known game definitions\./,
      `${newEntry}\n/**\n * Returns the list of all known game definitions.`,
    );

    writeFileSync(registryPath, registryContent);
    info(`Registered in gameRegistry.ts`);
  } else {
    info(`Already registered in gameRegistry.ts, skipping.`);
  }

  // --- Auto-commit ---
  const filesToAdd = [
    `public/games/${gameId}.json`,
    `public/img/${gameId}/`,
    `src/editor/data/gameRegistry.ts`,
  ];

  try {
    const gameName = gameDef.name || gameId;
    const commitMsg = isNew
      ? `feat: add game '${gameName}'`
      : `feat: update game '${gameName}'`;
    execSync(`git add ${filesToAdd.join(" ")}`, {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
    execSync(`git commit -m "${commitMsg}"`, {
      cwd: REPO_ROOT,
      stdio: "pipe",
    });
    info(`Changes committed: "${commitMsg}"`);
  } catch (commitErr) {
    console.warn(`  ⚠️  Git commit failed or nothing to commit. You may need to commit manually:`);
    console.warn(`     git add ${filesToAdd.join(" ")}`);
    console.warn(`     git commit -m "feat: update game '${gameName}'"`);
  }

  console.log(`\n✅ Game "${gameId}" installed successfully!\n`);
  console.log(`   JSON:          public/games/${gameId}.json`);
  console.log(`   Images:        public/img/${gameId}/`);
  console.log(`   Registry:      src/editor/data/gameRegistry.ts\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});