import JSZip from "jszip";
import type { GameDefinition } from "@/types/game";

/**
 * Deep-clones a value, rounding any number properties named 'x' or 'y'
 * (at any depth) to 2 decimal places.
 */
function roundPositionValues(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "number") return obj;
  if (typeof obj === "string") return obj;
  if (typeof obj === "boolean") return obj;
  if (Array.isArray(obj)) {
    return obj.map(roundPositionValues);
  }
  if (typeof obj === "object") {
    const cloned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if ((key === "x" || key === "y") && typeof value === "number") {
        cloned[key] = Math.round(value * 100) / 100;
      } else {
        cloned[key] = roundPositionValues(value);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Collect all unique image URLs from a game definition (face + back images).
 */
function collectImageUrls(game: GameDefinition): string[] {
  const urls = new Set<string>();
  for (const component of game.components) {
    if (component.type === "card") {
      if (component.face.image) urls.add(component.face.image);
      if (component.back?.image) urls.add(component.back.image);
    }
  }
  return Array.from(urls);
}

/**
 * Extract a filename from a URL (blob URL, relative path, or absolute URL).
 * For blob URLs, generates a unique name based on card id context.
 * For relative/absolute URLs, extracts the basename.
 */
function getImageFilename(url: string, index: number): string {
  if (url.startsWith("blob:")) {
    return `image-${index}.png`;
  }
  // Extract filename from path
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  if (last && last.includes(".")) return last;
  return `image-${index}.png`;
}

/**
 * Downloads a game definition as a ZIP file containing:
 * - The game JSON (with image URLs rewritten to relative paths)
 * - All referenced images (fetched from blob URLs or copied)
 *
 * The ZIP structure is:
 *   <gameId>.json
 *   img/
 *     <filename1>
 *     <filename2>
 *     ...
 */
export async function downloadGameZip(game: GameDefinition, gameId: string): Promise<void> {
  const zip = new JSZip();
  const cleaned = roundPositionValues(game) as GameDefinition;

  // Collect image URLs and fetch them
  const imageUrls = collectImageUrls(cleaned);
  const imageMap = new Map<string, string>(); // url -> relative path in zip

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = getImageFilename(url, i);
    const zipPath = `img/${filename}`;
    imageMap.set(url, zipPath);

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(zipPath, blob);
    } catch (err) {
      console.warn(`[gameExportZip] Failed to fetch image: ${url.substring(0, 60)}`, err);
    }
  }

  // Rewrite image URLs in the game JSON to relative paths
  const rewrittenGame = JSON.parse(JSON.stringify(cleaned)) as GameDefinition;
  for (const component of rewrittenGame.components) {
    if (component.type === "card") {
      if (component.face.image && imageMap.has(component.face.image)) {
        component.face.image = `../${imageMap.get(component.face.image)}`;
      }
      if (component.back?.image && imageMap.has(component.back.image)) {
        component.back.image = `../${imageMap.get(component.back.image)}`;
      }
    }
  }

  // Add the JSON file
  const jsonString = JSON.stringify(rewrittenGame, null, 2);
  zip.file(`${gameId}.json`, jsonString);

  // Generate and download the ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${gameId}.zip`;
  anchor.click();

  URL.revokeObjectURL(url);
}